CREATE VIEW LatestValues AS
WITH LatestKP AS (
    SELECT 
        deviceID, 
        kp, 
        recorded_at,
        ROW_NUMBER() OVER (PARTITION BY deviceID ORDER BY recorded_at DESC) AS rn
    FROM 
        controller
    WHERE 
        kp IS NOT NULL
),
LatestTI AS (
    SELECT 
        deviceID, 
        ti, 
        recorded_at,
        ROW_NUMBER() OVER (PARTITION BY deviceID ORDER BY recorded_at DESC) AS rn
    FROM 
        controller
    WHERE 
        ti IS NOT NULL
),
LatestTD AS (
    SELECT 
        deviceID, 
        td, 
        recorded_at,
        ROW_NUMBER() OVER (PARTITION BY deviceID ORDER BY recorded_at DESC) AS rn
    FROM 
        controller
    WHERE 
        td IS NOT NULL
),
LatestSetpoint AS (
    SELECT 
        deviceID, 
        setpoint, 
        setpoint_unit,
        recorded_at,
        ROW_NUMBER() OVER (PARTITION BY deviceID ORDER BY recorded_at DESC) AS rn
    FROM 
        controller
    WHERE 
        setpoint IS NOT NULL
),
LatestHeaterOutput AS (
    SELECT 
        deviceID, 
        heater_output, 
        heater_unit,
        recorded_at,
        ROW_NUMBER() OVER (PARTITION BY deviceID ORDER BY recorded_at DESC) AS rn
    FROM 
        controls
    WHERE 
        heater_output IS NOT NULL
),
LatestFanOutput AS (
    SELECT 
        deviceID, 
        fan_output, 
        fan_unit,
        recorded_at,
        ROW_NUMBER() OVER (PARTITION BY deviceID ORDER BY recorded_at DESC) AS rn
    FROM 
        controls
    WHERE 
        fan_output IS NOT NULL
),
LatestAlpha AS (
    SELECT 
        deviceID, 
        alpha, 
        recorded_at,
        ROW_NUMBER() OVER (PARTITION BY deviceID ORDER BY recorded_at DESC) AS rn
    FROM 
        filter
    WHERE 
        alpha IS NOT NULL
)
SELECT 
    d.device_name,
    kp.kp,
    ti.ti,
    td.td,
    sp.setpoint,
    sp.setpoint_unit, 
    ho.heater_output,
    ho.heater_unit,
    fo.fan_output,
    fo.fan_unit,
    alpha.alpha,
    COALESCE(kp.recorded_at, ti.recorded_at, td.recorded_at, sp.recorded_at) AS recorded_at
FROM 
    device AS d
LEFT JOIN 
    LatestKP AS kp ON d.id = kp.deviceID AND kp.rn = 1
LEFT JOIN 
    LatestTI AS ti ON d.id = ti.deviceID AND ti.rn = 1
LEFT JOIN 
    LatestTD AS td ON d.id = td.deviceID AND td.rn = 1
LEFT JOIN 
    LatestSetpoint AS sp ON d.id = sp.deviceID AND sp.rn = 1
LEFT JOIN 
    LatestHeaterOutput AS ho ON d.id = ho.deviceID AND ho.rn = 1
LEFT JOIN 
    LatestFanOutput AS fo ON d.id = fo.deviceID AND fo.rn = 1
LEFT JOIN 
    LatestAlpha AS alpha ON d.id = alpha.deviceID AND alpha.rn = 1;
