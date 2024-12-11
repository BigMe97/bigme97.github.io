CREATE TABLE [temperatures] (
	[id] int IDENTITY(1,1) NOT NULL UNIQUE,
	[deviceID] int NOT NULL,
	[recorded_at] datetime NOT NULL DEFAULT GETDATE(),
	[temperature] decimal(18,4) NOT NULL,
	[unit] nvarchar(6) NOT NULL DEFAULT 'C',
	PRIMARY KEY ([id])
);

CREATE TABLE [controls] (
	[id] int IDENTITY(1,1) NOT NULL UNIQUE,
	[deviceID] int NOT NULL,
	[recorded_at] datetime NOT NULL DEFAULT GETDATE(),
	[heater_output] decimal(18,4),
	[heater_unit] nvarchar(6) DEFAULT 'V',
	[fan_output] decimal(18,4),
	[fan_unit] nvarchar(6) DEFAULT 'V',
	PRIMARY KEY ([id])
);

CREATE TABLE [controller] (
	[id] int IDENTITY(1,1) NOT NULL UNIQUE,
	[deviceID] int NOT NULL,
	[recorded_at] datetime NOT NULL DEFAULT GETDATE(),
	[kp] decimal(18,10),
	[ti] decimal(18,10),
	[td] decimal(18,10),
	[setpoint] decimal(18,4),
	[setpoint_unit] nvarchar(6) NOT NULL DEFAULT 'C',
	PRIMARY KEY ([id])
);

CREATE TABLE [filter] (
	[id] int IDENTITY(1,1) NOT NULL UNIQUE,
	[deviceID] int NOT NULL,
	[recorded_at] datetime NOT NULL DEFAULT GETDATE(),
	[alpha] decimal(18,4) NOT NULL,
	PRIMARY KEY ([id])
);

CREATE TABLE [device] (
	[id] int IDENTITY(1,1) NOT NULL UNIQUE,
	[device_name] nvarchar(30) NOT NULL,
	PRIMARY KEY ([id])
);

ALTER TABLE [temperatures] ADD CONSTRAINT [temperatures_fk1] FOREIGN KEY ([deviceID]) REFERENCES [device]([id]);
ALTER TABLE [controls] ADD CONSTRAINT [controls_fk1] FOREIGN KEY ([deviceID]) REFERENCES [device]([id]);
ALTER TABLE [controller] ADD CONSTRAINT [controller_fk1] FOREIGN KEY ([deviceID]) REFERENCES [device]([id]);
ALTER TABLE [filter] ADD CONSTRAINT [filter_fk1] FOREIGN KEY ([deviceID]) REFERENCES [device]([id]);
