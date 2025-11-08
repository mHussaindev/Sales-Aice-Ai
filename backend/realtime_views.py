"""
Django Views with WebSocket Integration for Real-time Call Updates
"""

import json
from datetime import datetime
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .consumers import WebSocketNotifier


@csrf_exempt
@require_http_methods(["POST"])
def webhook_transcript_update(request):
    """
    Webhook endpoint for receiving real-time transcript updates
    Call this from your voice service (Twilio, etc.) when new speech is transcribed
    """
    try:
        data = json.loads(request.body)
        call_id = data.get('call_id')
        speaker = data.get('speaker', 'unknown')  # 'agent', 'caller', 'customer'
        message = data.get('message', '')
        session_id = data.get('session_id', call_id)
        
        if not call_id or not message:
            return JsonResponse({'error': 'Missing call_id or message'}, status=400)
        
        # Create transcript item
        transcript_item = {
            'session_id': session_id,
            'speaker': speaker,
            'message': message,
            'timestamp': datetime.now().isoformat()
        }
        
        # Send to WebSocket clients in real-time
        async_to_sync(WebSocketNotifier.send_transcript_update)(
            call_id=call_id,
            transcript_item=transcript_item
        )
        
        print(f"📝 Transcript update sent for call {call_id}: {speaker} - {message[:50]}...")
        
        return JsonResponse({
            'success': True,
            'message': 'Transcript updated',
            'call_id': call_id,
            'timestamp': datetime.now().isoformat()
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        print(f"Error in transcript webhook: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def webhook_emotion_update(request):
    """
    Webhook endpoint for receiving real-time emotion analysis updates
    Call this from your AI emotion detection service
    """
    try:
        data = json.loads(request.body)
        call_id = data.get('call_id')
        emotion = data.get('emotion', 'neutral')
        confidence = data.get('confidence', 0.0)
        
        if not call_id:
            return JsonResponse({'error': 'Missing call_id'}, status=400)
        
        # Send to WebSocket clients in real-time
        async_to_sync(WebSocketNotifier.send_emotion_update)(
            call_id=call_id,
            emotion=emotion,
            confidence=float(confidence)
        )
        
        print(f"🧠 Emotion update sent for call {call_id}: {emotion} ({confidence})")
        
        return JsonResponse({
            'success': True,
            'message': 'Emotion updated',
            'call_id': call_id,
            'emotion': emotion,
            'confidence': confidence,
            'timestamp': datetime.now().isoformat()
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        print(f"Error in emotion webhook: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def webhook_call_started(request):
    """
    Webhook endpoint for new call notifications
    Call this when a new call starts to notify all agents in real-time
    """
    try:
        data = json.loads(request.body)
        call_id = data.get('call_id')
        call_type = data.get('call_type', 'inbound')  # 'inbound' or 'outbound'
        caller_number = data.get('caller_number')
        caller_name = data.get('caller_name', '')
        agent_id = data.get('agent_id')
        agent_name = data.get('agent_name', '')
        
        if not call_id or not caller_number or not agent_id:
            return JsonResponse({
                'error': 'Missing required fields: call_id, caller_number, agent_id'
            }, status=400)
        
        # Send new call notification to WebSocket clients
        async_to_sync(WebSocketNotifier.send_new_call_notification)({
            'call_id': call_id,
            'call_type': call_type,
            'caller_number': caller_number,
            'caller_name': caller_name,
            'agent_id': agent_id,
            'agent_name': agent_name,
            'start_time': datetime.now().isoformat()
        })
        
        print(f"📞 New call notification sent: {call_type} call {call_id} - {caller_number}")
        
        return JsonResponse({
            'success': True,
            'message': 'Call started notification sent',
            'call_id': call_id,
            'timestamp': datetime.now().isoformat()
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        print(f"Error in call started webhook: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def webhook_call_ended(request):
    """
    Webhook endpoint for call ended notifications
    Call this when a call ends to update the UI in real-time
    """
    try:
        data = json.loads(request.body)
        call_id = data.get('call_id')
        end_time = data.get('end_time')
        duration = data.get('duration')  # in seconds
        outcome = data.get('outcome', 'completed')  # 'completed', 'missed', 'failed', etc.
        
        if not call_id:
            return JsonResponse({'error': 'Missing call_id'}, status=400)
        
        # Send call ended notification to WebSocket clients
        async_to_sync(WebSocketNotifier.send_call_ended_notification)(
            call_id=call_id,
            end_time=end_time,
            duration=duration,
            outcome=outcome
        )
        
        print(f"📞 Call ended notification sent: {call_id} - {outcome}")
        
        return JsonResponse({
            'success': True,
            'message': 'Call ended notification sent',
            'call_id': call_id,
            'outcome': outcome,
            'timestamp': datetime.now().isoformat()
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        print(f"Error in call ended webhook: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def websocket_status(request):
    """
    Check WebSocket status and active connections
    Useful for debugging and monitoring
    """
    try:
        channel_layer = get_channel_layer()
        
        return JsonResponse({
            'websocket_enabled': channel_layer is not None,
            'channel_layer_type': str(type(channel_layer).__name__) if channel_layer else None,
            'timestamp': datetime.now().isoformat(),
            'endpoints': {
                'calls': '/ws/calls/',
                'monitor': '/ws/monitor/',
                'agent_specific': '/ws/calls/{agent_id}/'
            }
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# Test endpoint for sending mock real-time updates
@csrf_exempt
@require_http_methods(["POST"])
def test_realtime_update(request):
    """
    Test endpoint for sending mock real-time updates
    Useful for testing the WebSocket integration
    """
    try:
        data = json.loads(request.body)
        update_type = data.get('type', 'transcript')
        call_id = data.get('call_id', 'test_call_123')
        
        if update_type == 'transcript':
            # Send mock transcript update
            transcript_item = {
                'session_id': call_id,
                'speaker': data.get('speaker', 'agent'),
                'message': data.get('message', 'This is a test message'),
                'timestamp': datetime.now().isoformat()
            }
            
            async_to_sync(WebSocketNotifier.send_transcript_update)(
                call_id=call_id,
                transcript_item=transcript_item
            )
            
        elif update_type == 'emotion':
            # Send mock emotion update
            async_to_sync(WebSocketNotifier.send_emotion_update)(
                call_id=call_id,
                emotion=data.get('emotion', 'happy'),
                confidence=data.get('confidence', 0.85)
            )
            
        elif update_type == 'new_call':
            # Send mock new call notification
            async_to_sync(WebSocketNotifier.send_new_call_notification)({
                'call_id': call_id,
                'call_type': data.get('call_type', 'inbound'),
                'caller_number': data.get('caller_number', '+1234567890'),
                'caller_name': data.get('caller_name', 'Test Caller'),
                'agent_id': data.get('agent_id', 'agent_1'),
                'agent_name': data.get('agent_name', 'Test Agent')
            })
            
        elif update_type == 'call_ended':
            # Send mock call ended notification
            async_to_sync(WebSocketNotifier.send_call_ended_notification)(
                call_id=call_id,
                duration=data.get('duration', 300),
                outcome=data.get('outcome', 'completed')
            )
        
        return JsonResponse({
            'success': True,
            'message': f'Test {update_type} update sent',
            'call_id': call_id,
            'timestamp': datetime.now().isoformat()
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)