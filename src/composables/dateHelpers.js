import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export function parseTimestamp(timestamp) {
    if (!timestamp) return null;

    try {
        let date;

        if (typeof timestamp === 'number') {
            if (timestamp > 1000000000000) {
                date = new Date(timestamp);
            } else {
                date = new Date(timestamp * 1000);
            }
        } else if (typeof timestamp === 'string') {
            date = new Date(timestamp);
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else {
            console.warn('❌ Unknown timestamp format:', timestamp);
            return null;
        }

        if (isNaN(date.getTime())) {
            console.warn('❌ Invalid timestamp:', timestamp);
            return null;
        }

        return date;
    } catch (error) {
        console.error('❌ parseTimestamp error:', error, timestamp);
        return null;
    }
}

export function formatDate(timestamp, formatStr = 'dd.MM.yyyy') {
    const date = parseTimestamp(timestamp);
    if (!date) return 'неизвестно';

    try {
        return format(date, formatStr, { locale: ru });
    } catch (error) {
        console.error('❌ formatDate error:', error, timestamp);
        return 'неизвестно';
    }
}

export function formatDateTime(timestamp) {
    return formatDate(timestamp, 'dd.MM.yyyy HH:mm');
}

export function formatRelativeTime(timestamp) {
    const date = parseTimestamp(timestamp);
    if (!date) return 'никогда';

    try {
        if (date.getFullYear() < 2020) {
            return 'давно';
        }

        return formatDistanceToNow(date, {
            addSuffix: true,
            locale: ru
        });
    } catch (error) {
        console.error('❌ formatRelativeTime error:', error, timestamp);
        return 'неизвестно';
    }
}

export function formatLastLogin(timestamp) {
    if (!timestamp) return 'Никогда';
    return formatRelativeTime(timestamp);
}

export function getCurrentTimestamp() {
    return Math.floor(Date.now() / 1000);
}

export function isValidTimestamp(timestamp) {
    const date = parseTimestamp(timestamp);
    return date !== null;
}


export function debugTimestamps(obj, label = 'Object') {
    console.group(`🐛 ${label} Timestamps Debug`);
    console.log('📋 Original object:', obj);

    const timestampFields = [
        'createdAt', 'created_at',
        'updatedAt', 'updated_at',
        'lastLoginAt', 'last_login_at',
        'timestamp', 'date', 'time'
    ];

    timestampFields.forEach(field => {
        if (obj && obj[field] !== undefined) {
            const parsed = parseTimestamp(obj[field]);
            console.log(`🔍 ${field}:`,
                obj[field],
                `(${typeof obj[field]})`,
                '→',
                parsed,
                parsed ? `→ ${formatDateTime(obj[field])}` : ''
            );
        }
    });
    console.groupEnd();
}


export function convertBackendTimestamps(backendObject) {
    if (!backendObject) return backendObject;

    const converted = { ...backendObject };

    const fieldMapping = {
        'created_at': 'createdAt',
        'updated_at': 'updatedAt',
        'last_login_at': 'lastLoginAt'
    };

    Object.entries(fieldMapping).forEach(([backendField, frontendField]) => {
        if (converted[backendField]) {
            const date = parseTimestamp(converted[backendField]);
            converted[frontendField] = date;

            // Можем оставить и оригинальное поле для совместимости
            // delete converted[backendField]; // Раскомментировать, если нужно удалять
        }
    });

    return converted;
}

export default {
    parseTimestamp,
    formatDate,
    formatDateTime,
    formatRelativeTime,
    formatLastLogin,
    getCurrentTimestamp,
    isValidTimestamp,
    debugTimestamps,
    convertBackendTimestamps
};