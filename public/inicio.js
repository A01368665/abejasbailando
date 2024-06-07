// scripts.js
document.addEventListener('DOMContentLoaded', () => {
    const squares = document.querySelectorAll('.square');
    const circles = document.querySelectorAll('.circle');
    const submitBtn = document.getElementById('submitBtn');
    const selector = document.getElementById('selector');
    const lastReceivedTime = document.getElementById('lastReceivedTime');
    const humidityChart = document.getElementById('humidityChart').getContext('2d');
    const chartContainer = document.getElementById('humidityChart');
    const chartWrapper = document.getElementById('chartWrapper');
    let chartInstance;
    const baseUrl = process.env.BASE_URI;
    // Function to fetch and update the values for squares and circles
    function fetchAndUpdateValues() {
        
        fetch(`${baseUrl}/api/values`)
            .then(response => response.json())
            .then(data => {
                const { sensorData, lastReceivedTime } = data;
    
                // Function to get the latest humidity value from the sensor data object
                const getLatestHumidity = (sensor) => {
                    const entries = Object.values(sensor);
                    if (entries.length > 0) {
                        const latestEntry = entries[entries.length - 1]; // Assuming the last entry is the latest
                        return latestEntry.humidity;
                    }
                    return 'N/A';
                };
    
                // Update squares
                for (let i = 1; i <= 8; i++) {
                    if (sensorData[i]) {
                        document.getElementById(`${i}`).textContent = getLatestHumidity(sensorData[i]);
                    } else {
                        document.getElementById(`${i}`).textContent = 'N/A';
                    }
                }
    
                // Update circles
                for (let i = 9; i <= 10; i++) {
                    if (sensorData[i]) {
                        document.getElementById(`${i - 8}`).textContent = getLatestHumidity(sensorData[i]);
                    } else {
                        document.getElementById(`${i - 8}`).textContent = 'N/A';
                    }
                }
                const formattedLastReceivedTime = moment(lastReceivedTime).format('YYYY-MM-DD HH:mm:ss');
                document.getElementById('lastReceivedTime').textContent = formattedLastReceivedTime;
          
            })
            .catch(error => {
                console.error('Error fetching values:', error);
            });
    }
    
    
    // Function to fetch and render the chart data
    function fetchAndRenderChart(id) {
        fetch(`${baseUrl}/api/data/${id}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Received chart data:', data);
    
                if (!data || Object.keys(data).length === 0) {
                    console.log('No chart data received.');
                    return;
                }
    
                const sensorValues = Object.values(data).map(item => ({
                    humidity: item.humidity,
                    time: moment(item.time) // Parse date with Moment.js
                }));
                console.log('Sensor values:', sensorValues);
    
                const labels = sensorValues.map(item => item.time.format('YYYY-MM-DDTHH:mm:ss')); // Format date with Moment.js
                const values = sensorValues.map(item => item.humidity);
    
                console.log('Labels:', labels);
                console.log('Values:', values);
    
                if (chartInstance) {
                    console.log('Destroying existing chart instance...');
                    chartInstance.destroy();
                  
                }
                document.getElementById('chartWrapper').classList.remove('hidden');
    
                const ctx = document.getElementById('humidityChart').getContext('2d');
                console.log('Rendering new chart...');
                chartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Humidity',
                            data: values,
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        scales: {
                            x: {
                                type: 'time',
                                time: {
                                    unit: 'minute',
                                    stepSize: 5
                                }
                            },
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
    
                console.log('Displaying chart wrapper...');
                document.getElementById('chartWrapper').classList.remove('hidden'); // Show the chartWrapper
            })
            .catch(error => {
                console.error('Error fetching chart data:', error);
            });
    }
    
    
    const submitMotorState = async (motorId) => {
        try {
            const response = await fetch(`${baseUrl}/api/motor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ "motorId": motorId })
            });
            const data = await response.json();
            console.log(data.message); // Log the response message
        } catch (error) {
            console.error('Error submitting motor state:', error);
        }
    };
    

    // Event listener for square clicks
    squares.forEach(square => {
        square.addEventListener('click', (e) => {
            const id = e.target.id;
            console.log(id)
            fetchAndRenderChart(id);
        });
    });


    submitBtn.addEventListener('click', () => {
        const selectedValue = selector.value;
        console.log('Selected Plant:', selectedValue);
        submitMotorState(selectedValue);
    });


    // Periodically fetch and update values
    fetchAndUpdateValues();
    setInterval(fetchAndUpdateValues, 60000); // Update every minute
});
