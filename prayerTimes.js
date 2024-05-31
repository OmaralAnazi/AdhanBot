async function getPrayerTimes() {
    const fetch = (await import('node-fetch')).default;
    const city = 'Riyadh';
    const country = 'Saudi Arabia';
    const method = 1; 

    const response = await fetch(`http://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=${method}`);
    const data = await response.json();

    if (data.code !== 200) {
        throw new Error('Failed to fetch prayer times');
    }

    const timings = data.data.timings;

    // Format the timings if needed
    const formattedTimings = {
        Fajr: timings.Fajr,
        Dhuhr: timings.Dhuhr,
        Asr: timings.Asr,
        Maghrib: timings.Maghrib,
        Isha: timings.Isha,
    };

    return formattedTimings;
}

module.exports = { getPrayerTimes };
