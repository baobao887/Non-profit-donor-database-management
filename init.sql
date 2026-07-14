CREATE TABLE Donors (
    DonorID         INT             PRIMARY KEY     AUTO_INCREMENT,
    DonorLevel      VARCHAR(10)     NOT NULL,
    FirstName       VARCHAR(50)     NOT NULL,
    LastName        VARCHAR(50),
    Email           VARCHAR(50)     UNIQUE,
    Phone           VARCHAR(20)     UNIQUE,
    Address         VARCHAR(100),
    DateRegistered  DATE            NOT NULL        CURRENT_DATE
);

CREATE TABLE Campaigns (
    CampaignID      INT             PRIMARY KEY     AUTO_INCREMENT,
    CampaignName    VARCHAR(100)    NOT NULL,
    CauseType       VARCHAR(50)     NOT NULL,
    StartDate       DATE            NOT NULL        CURRENT_DATE,
    EndDate         DATE,
    TargetAmount    DECIMAL(10,2),
    Status          VARCHAR(10)     NOT NULL
);

CREATE TABLE Donations (
    DonationID      INT             PRIMARY KEY     AUTO_INCREMENT,
    DonorID         INT             NOT NULL,
    CampaignID      INT             NOT NULL,
    PaymentMethod   VARCHAR(20),
    Amount          DECIMAL(10,2)   NOT NULL,
    DonationDate    DATE            NOT NULL        CURRENT_DATE,
    DonationStatus  VARCHAR(10)     NOT NULL,
    Notes           VARCHAR(150),
    CONSTRAINT donor_fk FOREIGN KEY (DonorID) REFERENCES Donors.DonorID,
    CONSTRAINT campaign_fk FOREIGN KEY (CampaignID) REFERENCES Campaigns.CampaignID
);

CREATE TABLE Communication_Logs (
    LogID       INT             PRIMARY KEY     AUTO_INCREMENT,
    DonorID     INT             NOT NULL,
    StaffID     INT             NOT NULL,
    CommType    VARCHAR(20)     NOT NULL,
    DateSent    DATE            NOT NULL,
    Subject     VARCHAR(50),
    Status      VARCHAR(10)     NOT NULL,
    Notes       VARCHAR(150),
    CONSTRAINT donor_fk FOREIGN KEY (DonorID) REFERENCES Donors.DonorID,
    CONSTRAINT staff_fk FOREIGN KEY (StaffID) REFERENCES Staffs.StaffID
);

CREATE TABLE Staffs (
    StaffID     INT     PRIMARY KEY,
    FirstName   VARCHAR(50)     NOT NULL,
    LastName    VARCHAR(50),
    Role        VARCHAR(20)     NOT NULL,
    Email       VARCHAR(50)     UNIQUE
);
