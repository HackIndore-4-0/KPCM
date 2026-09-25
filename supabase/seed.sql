-- Seed Sample Dispute for HackIndore Live Demo
INSERT INTO disputes (dispute_id, citizen_name, citizen_contact, complaint_text, domain, status, confidence_score, claimed_amount)
VALUES (
    'GRV-2026-9921',
    'Vaidik Lahoria',
    '+919876543210',
    '₹25,000 was debited from my SBI account to buy an iPad from MegaRetail, but merchant never received funds and order was cancelled.',
    'DIGITAL_PAYMENTS_UPI',
    'RESOLVED',
    0.95,
    25000.00
) ON CONFLICT (dispute_id) DO NOTHING;
