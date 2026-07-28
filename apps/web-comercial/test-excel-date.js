const str = "45413"; // Some excel date
const d1 = new Date(str);
console.log("Normal JS Date:", d1.toISOString());

if (/^\d{4,5}$/.test(str)) {
    const serial = parseInt(str, 10);
    const d2 = new Date(Math.round((serial - 25569) * 86400 * 1000));
    console.log("Excel Date:", d2.toISOString());
}
