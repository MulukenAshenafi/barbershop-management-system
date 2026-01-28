"""
Chapa Payment Gateway Client
Handles all Chapa API interactions
"""
import requests
import hmac
import hashlib
import json
from django.conf import settings
from typing import Dict, Optional


class ChapaClient:
    """Client for interacting with Chapa Payment Gateway API."""
    
    BASE_URL = "https://api.chapa.co/v1"
    
    def __init__(self):
        self.secret_key = settings.CHAPA_SECRET_KEY
        self.public_key = settings.CHAPA_PUBLIC_KEY
        self.webhook_secret = getattr(settings, 'CHAPA_WEBHOOK_SECRET', '')
        self.headers = {
            'Authorization': f'Bearer {self.secret_key}',
            'Content-Type': 'application/json'
        }
    
    def initialize_transaction(self, 
                              amount: float,
                              currency: str = 'ETB',
                              email: str = '',
                              first_name: str = '',
                              last_name: str = '',
                              phone_number: str = '',
                              tx_ref: str = '',
                              callback_url: str = '',
                              return_url: str = '',
                              meta: Optional[Dict] = None) -> Dict:
        """
        Initialize a Chapa transaction.
        
        Args:
            amount: Amount to charge
            currency: Currency code (default: ETB)
            email: Customer email
            first_name: Customer first name
            last_name: Customer last name
            phone_number: Customer phone number
            tx_ref: Unique transaction reference
            callback_url: Webhook callback URL
            return_url: Return URL after payment
            meta: Additional metadata
            
        Returns:
            Dict with transaction details including checkout_url
        """
        url = f"{self.BASE_URL}/transaction/initialize"
        
        payload = {
            'amount': str(amount),
            'currency': currency,
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
            'phone_number': phone_number,
            'tx_ref': tx_ref,
            'callback_url': callback_url,
            'return_url': return_url,
        }
        
        if meta:
            payload['meta'] = meta
        
        try:
            response = requests.post(url, json=payload, headers=self.headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Chapa API error: {str(e)}")
    
    def verify_transaction(self, tx_ref: str) -> Dict:
        """
        Verify a transaction by reference.
        
        Args:
            tx_ref: Transaction reference
            
        Returns:
            Dict with transaction verification details
        """
        url = f"{self.BASE_URL}/transaction/verify/{tx_ref}"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Chapa verification error: {str(e)}")
    
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """
        Verify webhook signature from Chapa.
        
        Args:
            payload: Raw request body
            signature: Signature from X-Chapa-Signature header
            
        Returns:
            True if signature is valid
        """
        if not self.webhook_secret:
            return False
        
        expected_signature = hmac.new(
            self.webhook_secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected_signature, signature)
    
    def generate_tx_ref(self, prefix: str = 'BSBS') -> str:
        """
        Generate a unique transaction reference.
        
        Args:
            prefix: Prefix for transaction reference
            
        Returns:
            Unique transaction reference
        """
        import uuid
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        unique_id = str(uuid.uuid4())[:8].upper()
        return f"{prefix}_{timestamp}_{unique_id}"
