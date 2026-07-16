/**
 * Data Store - API-Based (No localStorage, no mock data)
 * Fetches all data from MySQL database via PHP APIs
 */

let cache = null;
let sessionCheckInterval = null;

/**
 * Initialize store and verify authentication
 */
export async function initStore() {
  try {
    const sessionRes = await fetch('api/check-session.php');
    if (!sessionRes.ok) {
      window.location.href = 'login.php';
      return false;
    }
    
    const sessionData = await sessionRes.json();
    if (!sessionData.authenticated) {
      window.location.href = 'login.php';
      return false;
    }
    
    cache = { donors: [], campaigns: [], donations: [], communications: [], staff: [], stats: {} };
    if (!sessionCheckInterval) {
      sessionCheckInterval = setInterval(checkSession, 300000);
    }
    return true;
  } catch (error) {
    console.error('Store initialization error:', error);
    window.location.href = 'login.php';
    return false;
  }
}

async function checkSession() {
  try {
    const res = await fetch('api/check-session.php');
    if (!res.ok) {
      clearInterval(sessionCheckInterval);
      window.location.href = 'login.php';
    }
  } catch (error) {
    console.error('Session check error:', error);
  }
}

/**
 * Dashboard/Statistics Functions
 */
export async function getStats() {
  try {
    const res = await fetch('api/dashboard.php');
    if (!res.ok) throw new Error('Failed to fetch stats');
    const stats = await res.json();
    cache.stats = stats;
    return stats;
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { totalDonors: 0, totalDonations: 0, campaignCount: 0, activeCampaigns: 0, topDonors: [], recentDonations: [], campaignsNeedingAttention: [] };
  }
}

/**
 * Donor Functions
 */
export async function getDonors(page = 1, status = null) {
  try {
    let url = `api/donors.php?action=list&page=${page}`;
    if (status) url += `&status=${status}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch donors');
    const data = await res.json();
    cache.donors = data.donors || [];
    return cache.donors;
  } catch (error) {
    console.error('Error fetching donors:', error);
    return [];
  }
}

export async function getDonor(id) {
  try {
    const res = await fetch(`api/donors.php?action=get&id=${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error fetching donor:', error);
    return null;
  }
}

export async function getTopDonors(limit = 5) {
  try {
    const res = await fetch(`api/donors.php?action=top&limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch top donors');
    return await res.json();
  } catch (error) {
    console.error('Error fetching top donors:', error);
    return [];
  }
}

export async function searchDonors(query) {
  try {
    const res = await fetch(`api/donors.php?action=search&q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to search donors');
    return await res.json();
  } catch (error) {
    console.error('Error searching donors:', error);
    return [];
  }
}

export async function addDonor(donor) {
  try {
    const res = await fetch('api/donors.php?action=create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donor)
    });
    if (!res.ok) throw new Error('Failed to create donor');
    const data = await res.json();
    return data.donor_id;
  } catch (error) {
    console.error('Error adding donor:', error);
    throw error;
  }
}

export async function updateDonor(id, updates) {
  try {
    const res = await fetch('api/donors.php?action=update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ donor_id: id, ...updates })
    });
    if (!res.ok) throw new Error('Failed to update donor');
    return true;
  } catch (error) {
    console.error('Error updating donor:', error);
    throw error;
  }
}

export async function deleteDonor(id) {
  try {
    const res = await fetch('api/donors.php?action=archive', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ donor_id: id })
    });
    if (!res.ok) throw new Error('Failed to delete donor');
    return true;
  } catch (error) {
    console.error('Error deleting donor:', error);
    throw error;
  }
}

/**
 * Campaign Functions
 */
export async function getCampaigns(page = 1, status = null) {
  try {
    let url = `api/campaigns.php?action=list&page=${page}`;
    if (status) url += `&status=${status}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch campaigns');
    const data = await res.json();
    cache.campaigns = data.campaigns || [];
    return cache.campaigns;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
}

export async function getLiveCampaigns() {
  try {
    const res = await fetch('api/campaigns.php?action=live');
    if (!res.ok) throw new Error('Failed to fetch live campaigns');
    return await res.json();
  } catch (error) {
    console.error('Error fetching live campaigns:', error);
    return [];
  }
}

export async function getCampaignById(id) {
  try {
    const res = await fetch(`api/campaigns.php?action=get&id=${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return null;
  }
}

export async function addCampaign(campaign) {
  try {
    const res = await fetch('api/campaigns.php?action=create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaign)
    });
    if (!res.ok) throw new Error('Failed to create campaign');
    const data = await res.json();
    return data.campaign_id;
  } catch (error) {
    console.error('Error adding campaign:', error);
    throw error;
  }
}

export async function updateCampaign(id, updates) {
  try {
    const res = await fetch('api/campaigns.php?action=update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: id, ...updates })
    });
    if (!res.ok) throw new Error('Failed to update campaign');
    return true;
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw error;
  }
}

export async function deleteCampaign(id) {
  try {
    const res = await fetch('api/campaigns.php?action=archive', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: id })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete campaign');
    return true;
  } catch (error) {
    console.error('Error deleting campaign:', error);
    throw error;
  }
}

export async function updateCampaignStatus(id, status) {
  try {
    const res = await fetch('api/campaigns.php?action=update-status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: id, status })
    });
    if (!res.ok) throw new Error('Failed to update campaign status');
    return true;
  } catch (error) {
    console.error('Error updating campaign status:', error);
    throw error;
  }
}

/**
 * Donation Functions
 */
export async function getDonations(page = 1) {
  try {
    const res = await fetch(`api/donations.php?action=list&page=${page}`);
    if (!res.ok) throw new Error('Failed to fetch donations');
    const data = await res.json();
    cache.donations = data.donations || [];
    return cache.donations;
  } catch (error) {
    console.error('Error fetching donations:', error);
    return [];
  }
}

export async function getDonationsByDonor(donorId) {
  try {
    const res = await fetch(`api/donations.php?action=by-donor&donor_id=${donorId}`);
    if (!res.ok) throw new Error('Failed to fetch donor donations');
    return await res.json();
  } catch (error) {
    console.error('Error fetching donor donations:', error);
    return [];
  }
}

export async function getRecentDonations(limit = 10) {
  try {
    const res = await fetch(`api/donations.php?action=recent&limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch recent donations');
    return await res.json();
  } catch (error) {
    console.error('Error fetching recent donations:', error);
    return [];
  }
}

export async function getDonationTrend(months = 6) {
  try {
    const res = await fetch(`api/donations.php?action=trend&months=${months}`);
    if (!res.ok) throw new Error('Failed to fetch donation trend');
    return await res.json();
  } catch (error) {
    console.error('Error fetching donation trend:', error);
    return [];
  }
}

export async function getDonationBreakdown() {
  try {
    const res = await fetch('api/donations.php?action=breakdown');
    if (!res.ok) throw new Error('Failed to fetch donation breakdown');
    return await res.json();
  } catch (error) {
    console.error('Error fetching donation breakdown:', error);
    return [];
  }
}

export async function getPaymentMethodBreakdown() {
  try {
    const res = await fetch('api/donations.php?action=payment-breakdown');
    if (!res.ok) throw new Error('Failed to fetch payment breakdown');
    return await res.json();
  } catch (error) {
    console.error('Error fetching payment breakdown:', error);
    return [];
  }
}

export async function getWeekdayRevenue() {
  try {
    const res = await fetch('api/donations.php?action=weekday-revenue');
    if (!res.ok) throw new Error('Failed to fetch weekday revenue');
    return await res.json();
  } catch (error) {
    console.error('Error fetching weekday revenue:', error);
    return [];
  }
}

export async function addDonation(donation) {
  try {
    const res = await fetch('api/donations.php?action=create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donation)
    });
    if (!res.ok) throw new Error('Failed to create donation');
    const data = await res.json();
    return data.donation_id;
  } catch (error) {
    console.error('Error adding donation:', error);
    throw error;
  }
}

export async function updateDonation(id, updates) {
  try {
    const res = await fetch('api/donations.php?action=update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ donation_id: id, ...updates })
    });
    if (!res.ok) throw new Error('Failed to update donation');
    return true;
  } catch (error) {
    console.error('Error updating donation:', error);
    throw error;
  }
}

/**
 * Communication Functions
 */
export async function getCommunications(page = 1) {
  try {
    const res = await fetch(`api/communications.php?action=list&page=${page}`);
    if (!res.ok) throw new Error('Failed to fetch communications');
    const data = await res.json();
    cache.communications = data.communications || [];
    return { communications: cache.communications, total: data.total || 0, page: data.page || page, limit: data.limit || 20 };
  } catch (error) {
    console.error('Error fetching communications:', error);
    return { communications: [], total: 0, page, limit: 20 };
  }
}

export async function getCommunicationsByDonor(donorId) {
  try {
    const res = await fetch(`api/communications.php?action=by-donor&donor_id=${donorId}`);
    if (!res.ok) throw new Error('Failed to fetch donor communications');
    return await res.json();
  } catch (error) {
    console.error('Error fetching donor communications:', error);
    return [];
  }
}

export async function addCommunication(entry) {
  try {
    const res = await fetch('api/communications.php?action=create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create communication');
    return data.communication_id;
  } catch (error) {
    console.error('Error adding communication:', error);
    throw error;
  }
}

export async function updateCommunication(id, updates) {
  try {
    const res = await fetch('api/communications.php?action=update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ communication_id: id, ...updates })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update communication');
    return true;
  } catch (error) {
    console.error('Error updating communication:', error);
    throw error;
  }
}

export async function deleteCommunication(id) {
  try {
    const res = await fetch('api/communications.php?action=delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ communication_id: id })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete communication');
    return true;
  } catch (error) {
    console.error('Error deleting communication:', error);
    throw error;
  }
}

/**
 * Staff Functions
 */
export async function getStaff() {
  try {
    const res = await fetch('api/staff.php?action=list');
    if (!res.ok) throw new Error('Failed to fetch staff');
    const data = await res.json();
    cache.staff = data.staff || [];
    return cache.staff;
  } catch (error) {
    console.error('Error fetching staff:', error);
    return [];
  }
}

export async function addStaff(member) {
  try {
    const res = await fetch('api/staff.php?action=create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add staff member');
    return data;
  } catch (error) {
    console.error('Error adding staff member:', error);
    throw error;
  }
}

export async function updateStaff(id, updates) {
  try {
    const res = await fetch('api/staff.php?action=update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: id, ...updates })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update staff member');
    return true;
  } catch (error) {
    console.error('Error updating staff member:', error);
    throw error;
  }
}

export async function deleteStaff(id) {
  try {
    const res = await fetch('api/staff.php?action=delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: id })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to remove staff member');
    return true;
  } catch (error) {
    console.error('Error removing staff member:', error);
    throw error;
  }
}

/**
 * Reset Store
 */
export function resetStore() {
  cache = null;
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
    sessionCheckInterval = null;
  }
}
