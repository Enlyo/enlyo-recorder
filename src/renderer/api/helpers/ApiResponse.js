/**
 * Api response
 *
 * Used to have the same response type for every api
 */
export class ApiResponse {
    constructor(status, message, data) {
        this.status = status;
        this.message = message;
        this.data = data;
    }
}

/**
 * Get response success message
 * @param {String} type
 * @param {String} name
 * @returns
 */
export const getSuccessMessage = (type, name) => {
    if (type === 'create') {
        return `Created new ${name.toLowerCase()}`;
    }
    if (type === 'update') {
        return `${name} updated`;
    }
    if (type === 'delete') {
        return `${name} deleted`;
    }
    return 'Successful';
};

/**
 * Get response error message
 * @param {String} type
 * @param {String} name
 * @param {Object} message
 * @returns
 */
export const getErrorMessage = (type, name, message) => {
    if (type === 'create') {
        return `Failed to create ${name.toLowerCase()}`;
    }
    if (type === 'update') {
        return `Failed to update ${name.toLowerCase()}`;
    }
    if (type === 'delete') {
        return `Failed to delete ${name.toLowerCase()}`;
    }
    return message;
};
