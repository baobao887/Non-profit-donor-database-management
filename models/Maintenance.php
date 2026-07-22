<?php
/**
 * Maintenance Model
 *
 * On-demand integrity tooling for the denormalized aggregates:
 * campaigns.amount_raised, donors.total_donated and donors.donor_rank.
 *
 * Those columns are kept current by the donation write path, which recomputes
 * them inside the same transaction as the donation row. This class is the
 * recovery path for the cases a transaction cannot protect against — a direct
 * edit in phpMyAdmin, a partially applied migration, a future bug.
 *
 * It deliberately calls the SAME methods the write path uses
 * (Campaign::updateAmountRaised / Donor::updateTotalAndRank) rather than
 * re-deriving the SUM and the rank thresholds here, so there is exactly one
 * definition of how a total is computed. If the write path's filter ever
 * changes, this tool follows it automatically.
 */

class Maintenance {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Recompute every campaign and donor aggregate from the donations table.
     * The whole sweep runs in one transaction, so the totals are never left
     * half-corrected. Returns a summary of what was checked and corrected.
     */
    public function recalculateAllTotals() {
        $this->pdo->beginTransaction();
        try {
            $campaigns = $this->recalculateCampaigns();
            $donors = $this->recalculateDonors();

            $this->pdo->commit();

            return [
                'campaigns_checked'   => $campaigns['checked'],
                'campaigns_corrected' => $campaigns['corrected'],
                'donors_checked'      => $donors['checked'],
                'donors_corrected'    => $donors['corrected'],
                'total_corrected'     => $campaigns['corrected'] + $donors['corrected'],
                'corrections'         => array_merge($campaigns['details'], $donors['details']),
            ];
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Recompute amount_raised for every campaign via the write path's own
     * Campaign::updateAmountRaised().
     */
    private function recalculateCampaigns() {
        $campaignModel = new Campaign($this->pdo);
        $before = $this->pdo->query("
            SELECT campaign_id, campaign_name, amount_raised, updated_at
            FROM campaigns
        ")->fetchAll();

        $read = $this->pdo->prepare("SELECT amount_raised FROM campaigns WHERE campaign_id = ?");
        $restore = $this->pdo->prepare("UPDATE campaigns SET updated_at = ? WHERE campaign_id = ?");

        $corrected = 0;
        $details = [];

        foreach ($before as $row) {
            $id = (int)$row['campaign_id'];
            $was = round((float)$row['amount_raised'], 2);

            $campaignModel->updateAmountRaised($id);

            $read->execute([$id]);
            $now = round((float)$read->fetch()['amount_raised'], 2);

            if ($now !== $was) {
                $corrected++;
                $details[] = [
                    'type'  => 'campaign',
                    'id'    => $id,
                    'name'  => $row['campaign_name'],
                    'field' => 'amount_raised',
                    'from'  => $was,
                    'to'    => $now,
                ];
            } else {
                // The row was already correct — put updated_at back so a
                // no-op integrity check stays a genuine no-op and does not
                // reshuffle lists ordered by updated_at.
                $restore->execute([$row['updated_at'], $id]);
            }
        }

        return ['checked' => count($before), 'corrected' => $corrected, 'details' => $details];
    }

    /**
     * Recompute total_donated and donor_rank for every donor via the write
     * path's own Donor::updateTotalAndRank() (which applies getDonorRank()'s
     * thresholds, so the rank logic is not duplicated here either).
     */
    private function recalculateDonors() {
        $donorModel = new Donor($this->pdo);
        $before = $this->pdo->query("
            SELECT donor_id, first_name, last_name, total_donated, donor_rank, updated_at
            FROM donors
        ")->fetchAll();

        $read = $this->pdo->prepare("SELECT total_donated, donor_rank FROM donors WHERE donor_id = ?");
        $restore = $this->pdo->prepare("UPDATE donors SET updated_at = ? WHERE donor_id = ?");

        $corrected = 0;
        $details = [];

        foreach ($before as $row) {
            $id = (int)$row['donor_id'];
            $wasTotal = round((float)$row['total_donated'], 2);
            $wasRank = $row['donor_rank'];

            $donorModel->updateTotalAndRank($id);

            $read->execute([$id]);
            $after = $read->fetch();
            $nowTotal = round((float)$after['total_donated'], 2);
            $nowRank = $after['donor_rank'];

            if ($nowTotal !== $wasTotal || $nowRank !== $wasRank) {
                $corrected++;
                $details[] = [
                    'type'      => 'donor',
                    'id'        => $id,
                    'name'      => trim($row['first_name'] . ' ' . $row['last_name']),
                    'field'     => 'total_donated/donor_rank',
                    'from'      => $wasTotal,
                    'to'        => $nowTotal,
                    'from_rank' => $wasRank,
                    'to_rank'   => $nowRank,
                ];
            } else {
                $restore->execute([$row['updated_at'], $id]);
            }
        }

        return ['checked' => count($before), 'corrected' => $corrected, 'details' => $details];
    }
}
?>
