export const EXCHANGE_RATES: Record<string, number> = {
    IDR: 1,
    USD: 16500, // 1 USD = Rp 16.500
};

/**
 * Konversi nominal ke IDR berdasarkan mata uang asal.
 */
export const convertToIDR = (amount: number | bigint, currencyCode: string = 'IDR'): number => {
    const rate = EXCHANGE_RATES[currencyCode] ?? 1;
    return Number(amount) * rate;
};

export const formatCurrency = (amount: number | bigint, currencyCode: string = 'IDR'): string => {
    return new Intl.NumberFormat(currencyCode === 'IDR' ? 'id-ID' : 'en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: currencyCode === 'IDR' ? 0 : 2
    }).format(Number(amount));
};

