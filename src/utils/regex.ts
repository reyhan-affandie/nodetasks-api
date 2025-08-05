export const regexString = /^[a-zA-Z0-9\s\-/_.,”’!?#&()@:+`*]*$/;
// Allows alphanumeric characters, spaces, dashes, underscores, apostrophes, periods, and commas.
// Allows exclamation marks, hash symbols, question marks, ampersands, parentheses, at-symbols, and colons.
// Blocks <, >, ", \, =, %, *, {, } to prevent SQL Injection and XSS attacks.
export const regexNumber = /^[0-9]*$/;
// Allows empty string or numeric characters.
export const regexPrice = /^[0-9]+(\.[0-9])?$/;
// Allows whole numbers or numbers with one decimal place (e.g., 99, 99.9, 100).
export const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Does not allow empty string; requires a valid email format.
export const regexImage = /^$|^.*\.(jpg|jpeg|png)$/i;
// Allows empty string or valid image file extensions.
export const regexFile = /^$|^.*\.(pdf)$/i;
// Allows empty string or valid PDF file extension.
export const regexPassword = /^(?=.*[a-z])(?=.*\d)[A-Za-z\d@$!%*?&#]*$/;
// Password must contain at least one letter and one number; special characters and uppercase are optional (does not allow empty string).
export const regexAddress = /^[a-zA-Z0-9\s,.'-]*$/;
// Allows empty string or letters, numbers, spaces, commas, periods, apostrophes, and hyphens.
export const regexCountry = /^[A-Z]*$/;
// Allows empty string or capital letters.
export const regexPhone = /^\+\d{5,19}$/;
// Allows empty string, numeric characters, and the special character '+', but '+' is allowed only at the first position.
export const regexBoolean = /^(true|false)$/i;
// Check Boolean regex
export const regexURI = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
// Validates URLs starting with http, https, or ftp. Ensures proper URI formatting.
export const regexDate = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
// Strictly matches dates in 'YYYY-MM-DD' format with valid ranges for month and day.
export const regexTime = /^([01]\d|2[0-3]):([0-5]\d)$/;
// Matches 24-hour time format (e.g., 00:00 to 23:59)