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

    // Create the input field, submit button, and close button once
    const idealValueContainer = document.createElement('div');
    idealValueContainer.id = 'idealValueContainer';
    idealValueContainer.style.display = 'none'; // Initially hidden

    const idealValueInput = document.createElement('input');
    idealValueInput.type = 'number';
    idealValueInput.placeholder = 'Set Ideal Value';
    idealValueInput.id = 'idealValueInput';

    const submitIdealValueBtn = document.createElement('button');
    submitIdealValueBtn.textContent = 'Set Ideal Value';
    submitIdealValueBtn.id = 'submitIdealValueBtn';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.id = 'closeBtn';

    idealValueContainer.appendChild(idealValueInput);
    idealValueContainer.appendChild(submitIdealValueBtn);
    idealValueContainer.appendChild(closeBtn);
    document.body.appendChild(idealValueContainer); // Append to the body or a specific container

    function fetchAndUpdateValues() {
        fetch(`/api/values`)
            .then(response => response.json())
            .then(data => {
                const { sensorData, lastReceivedTime } = data;

                const getLatestHumidity = (sensor) => {
                    const entries = Object.values(sensor);
                    if (entries.length > 0) {
                        const latestEntry = entries[entries.length - 1]; 
                        return latestEntry.humidity;
                    }
                    return 'N/A';
                };

                for (let i = 1; i <= 10; i++) {
                    if (sensorData[i]) {
                        document.getElementById(`${i}`).textContent = getLatestHumidity(sensorData[i]);
                    } else {
                        document.getElementById(`${i}`).textContent = 'N/A';
                    }
                }

                const formattedLastReceivedTime = moment(lastReceivedTime).format('YYYY-MM-DD HH:mm:ss');
                document.getElementById('lastReceivedTime').textContent = formattedLastReceivedTime;
            })
            .catch(error => {
                console.error('Error fetching values:', error);
            });
    }

    function fetchAndRenderChart(id) {
        fetch(`/api/data/${id}`)
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
                    time: moment(item.time)
                }));
                console.log('Sensor values:', sensorValues);

                const labels = sensorValues.map(item => item.time.format('YYYY-MM-DDTHH:mm:ss'));
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
                                    unit: 'hour',
                                    stepSize: 1
                                }
                            },
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });

                document.getElementById('chartWrapper').classList.remove('hidden');
            })
            .catch(error => {
                console.error('Error fetching chart data:', error);
            });
    }

    const submitMotorState = async (motorId) => {
        try {
            const response = await fetch(`/api/motor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ "motorId": motorId })
            });
            const data = await response.json();
            console.log(data.message);
        } catch (error) {
            console.error('Error submitting motor state:', error);
        }
    };

    const submitIdealValue = async (sensorId, idealValue) => {
        try {
            // Make a POST request to update the ideal value
            const response = await fetch(`/api/sensor/${sensorId}/ideal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ idealValue: Number(idealValue) })

            });
    
            // Check if the response is okay (status code in the range 200-299)
            if (!response.ok) {
                // Get the response text for debugging
                const text = await response.text();
                console.error(`Error response: ${text}`);
                throw new Error('Network response was not ok');
            }
    
            // Parse the JSON response
            const data = await response.json();
            console.log(`Ideal value for sensor ${sensorId} updated:`, data.message);
    
            // Optionally, you might want to update the UI or show a success message
            alert(`Success: ${data.message}`);
    
        } catch (error) {
            // Handle errors appropriately
            console.error(`Error updating ideal value for sensor ${sensorId}:`, error);
            alert(`Failed to update ideal value. Please try again.`);
        }
    };
    

    const handleSensorClick = (id, element) => {
        console.log(id);
        fetchAndRenderChart(id);

        // Toggle visibility of the input field and buttons
        idealValueContainer.style.display = idealValueContainer.style.display === 'none' ? 'block' : 'none';
        
        // Set a data attribute to keep track of the current sensor ID
        idealValueContainer.dataset.sensorId = id;
    };

    // Event listener for the close button
    document.getElementById('closeBtn').addEventListener('click', () => {
        idealValueContainer.style.display = 'none'; // Hide the container
    });

    // Event listener for the submit ideal value button
    document.getElementById('submitIdealValueBtn').addEventListener('click', () => {
        const sensorId = idealValueContainer.dataset.sensorId;
        const idealValue = document.getElementById('idealValueInput').value;
        if (idealValue) {
            submitIdealValue(sensorId, idealValue);
        }
    });

    // Event listeners for square and circle clicks
    squares.forEach(square => {
        square.addEventListener('click', (e) => {
            handleSensorClick(e.target.id, square);
        });
    });

    circles.forEach(circle => {
        circle.addEventListener('click', (e) => {
            handleSensorClick(e.target.id, circle);
        });
    });

    submitBtn.addEventListener('click', () => {
        const selectedValue = selector.value;
        console.log('Selected Plant:', selectedValue);
        submitMotorState(selectedValue);
    });

    fetchAndUpdateValues();
    setInterval(fetchAndUpdateValues, 60000); // Update every minute
});
