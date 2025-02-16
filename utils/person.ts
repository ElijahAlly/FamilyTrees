export const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return dateString.split('T')[0].split('-').join('/');
};