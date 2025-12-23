-- ============================================
-- 6. INDIVIDUAL SAVINGS AMOUNTS
-- ============================================
-- Allow members to set custom savings amounts per cycle
-- Add privacy setting to hide savings from other members

ALTER TABLE cycle_members 
ADD COLUMN custom_savings_amount INTEGER NULL;

ALTER TABLE cycle_members 
ADD COLUMN hide_savings INTEGER DEFAULT 0;

-- Index for performance
CREATE INDEX idx_cycle_members_custom_savings 
ON cycle_members(cycle_id, custom_savings_amount);

-- Comments
-- custom_savings_amount: NULL = use cycle default, INTEGER = custom amount
-- hide_savings: 0 = visible (default), 1 = hidden from other members

