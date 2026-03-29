export const auditLog = (event: {
  timestamp: Date;
  event_type: string;
  ca: string;
  result: string;
  error?: string;
}) => {
  console.log('[AUDIT]', JSON.stringify({
    ...event,
    timestamp: event.timestamp.toISOString()
  }));
  // In production, this would log to a secure, encrypted database or log service
};
