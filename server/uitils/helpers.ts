
export const getOtp = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

export const isBlankField = (field: string): boolean => {
    if (!field || field == "") {
        return true;
    } else {
        return false;
    }
}