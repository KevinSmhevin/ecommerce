"""Public eBay notification endpoints.

The marketplace account-deletion endpoint is required for production keyset
access: eBay validates it with a GET challenge, then POSTs deletion events.
https://developer.ebay.com/develop/guides-v2/marketplace-user-account-deletion
"""

import hashlib
import json
import logging

from django.conf import settings
from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(['GET', 'POST'])
def account_deletion(request):
    """eBay marketplace account deletion/closure notifications.

    GET is eBay's endpoint-ownership challenge; POST is a real deletion event.
    """
    if request.method == 'GET':
        return _challenge_response(request)
    return _acknowledge_deletion(request)


def _challenge_response(request):
    challenge_code = request.GET.get('challenge_code')
    if not challenge_code:
        return HttpResponseBadRequest('missing challenge_code')

    token = settings.EBAY_VERIFICATION_TOKEN
    endpoint = settings.EBAY_DELETION_ENDPOINT
    if not token or not endpoint:
        logger.error('eBay deletion endpoint unconfigured: set EBAY_VERIFICATION_TOKEN and EBAY_DELETION_ENDPOINT')
        return JsonResponse({'error': 'endpoint not configured'}, status=500)

    # eBay requires this exact concatenation order, hex-encoded.
    digest = hashlib.sha256()
    digest.update(challenge_code.encode('utf-8'))
    digest.update(token.encode('utf-8'))
    digest.update(endpoint.encode('utf-8'))
    return JsonResponse({'challengeResponse': digest.hexdigest()}, status=200)


def _acknowledge_deletion(request):
    try:
        payload = json.loads(request.body or b'{}')
    except json.JSONDecodeError:
        payload = None
    # Pokebin's eBay integration only reads the seller's own inventory and
    # stores no eBay buyer PII, so there is nothing to erase — but eBay still
    # requires every production app to acknowledge the notification.
    logger.info('eBay account deletion notification received: %s', payload)
    return HttpResponse(status=200)
