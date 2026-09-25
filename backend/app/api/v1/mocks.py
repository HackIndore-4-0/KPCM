from fastapi import APIRouter
from app.mocks.mock_service import MockFinancialEcosystem

router = APIRouter()

@router.get("/cbs/{txn_id}")
async def get_mock_cbs(txn_id: str):
    return await MockFinancialEcosystem.query_bank_cbs(txn_id)

@router.get("/npci/{utr}")
async def get_mock_npci(utr: str):
    return await MockFinancialEcosystem.query_npci_switch(utr)

@router.get("/merchant/{order_id}")
async def get_mock_merchant(order_id: str):
    return await MockFinancialEcosystem.query_merchant_pg(order_id)
