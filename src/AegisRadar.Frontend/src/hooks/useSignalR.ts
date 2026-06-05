import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';

export function useSignalR() {
    const { token } = useAuth();
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

    useEffect(() => {
        if (!token) return;

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${API_BASE_URL}/hubs/fraud-alerts`, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);
    }, [token]);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    console.log('Connected to SignalR hub');
                    
                    connection.on('ReceiveFraudAlert', (alert) => {
                        toast.error(`Fraud Alert: ${alert.severity} Risk`, {
                            description: alert.message,
                            duration: 10000,
                        });
                    });
                })
                .catch(e => console.error('SignalR Connection Error: ', e));
        }

        return () => {
            if (connection) {
                connection.stop();
            }
        };
    }, [connection]);

    return connection;
}
