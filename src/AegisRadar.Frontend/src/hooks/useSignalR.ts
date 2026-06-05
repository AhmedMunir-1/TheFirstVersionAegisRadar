import { useEffect, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';

type SignalREventHandler = (data: any) => void;

const eventHandlers: Map<string, Set<SignalREventHandler>> = new Map();

export function useSignalR() {
    const { token, user } = useAuth();
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

    useEffect(() => {
        if (!token || !user) return;

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${API_BASE_URL}/hubs/fraud-alerts`, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);
    }, [token, user]);

    useEffect(() => {
        if (!connection || !user) return;

        connection.start()
            .then(() => {
                console.log('✅ Connected to SignalR hub');
                
                // Join merchant group
                connection.invoke('JoinMerchantGroup', user.id)
                    .catch(err => console.error('Failed to join group:', err));

                // Handle fraud alerts
                connection.on('FraudAlertReceived', (alert) => {
                    const severity = alert.severity?.toLowerCase() || 'medium';
                    const message = alert.message || 'New fraud alert';
                    
                    toast.error(`🚨 ${severity.toUpperCase()} Alert`, {
                        description: message,
                        duration: 10000,
                    });

                    // Notify local handlers
                    triggerEvent('fraudAlert', alert);
                });

                // Handle dashboard refresh signals
                connection.on('DashboardRefresh', (data) => {
                    console.log('📊 Dashboard refresh signal received');
                    triggerEvent('dashboardRefresh', data);
                });

                // Handle transaction updates
                connection.on('TransactionUpdated', (transaction) => {
                    console.log('💳 New transaction update:', transaction.id);
                    triggerEvent('transactionUpdated', transaction);
                });
            })
            .catch(e => {
                console.error('SignalR Connection Error:', e);
                toast.error('Real-time connection failed', {
                    description: 'Dashboard updates will be periodic only',
                    duration: 5000,
                });
            });

        return () => {
            if (connection?.state === signalR.HubConnectionState.Connected) {
                connection.invoke('LeaveMerchantGroup', user?.id)
                    .catch(() => {});
                connection.stop();
            }
        };
    }, [connection, user]);

    return connection;
}

function triggerEvent(eventName: string, data: any) {
    const handlers = eventHandlers.get(eventName);
    if (handlers) {
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (err) {
                console.error(`Error in ${eventName} handler:`, err);
            }
        });
    }
}

export function onSignalREvent(eventName: string, handler: SignalREventHandler) {
    if (!eventHandlers.has(eventName)) {
        eventHandlers.set(eventName, new Set());
    }
    eventHandlers.get(eventName)!.add(handler);

    return () => {
        eventHandlers.get(eventName)!.delete(handler);
    };
}
