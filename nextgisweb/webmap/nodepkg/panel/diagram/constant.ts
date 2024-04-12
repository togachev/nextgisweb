export const params = {
    fill: false,
    borderWidth: 1.5,
    lineTension: 0.25,
    showLine: true,
}

export const context = {
    area_mean: {
        label: "Площадь",
        pointBorderColor: "#FF0060",
        backgroundColor: '#FF0060',
        borderColor: "#FF0060",
        data: [],
        labels: [],
    },
    area_mean_forecast: {
        label: "Площадь (прогноз)",
        pointBorderColor: "#923D5D",
        backgroundColor: '#923D5D',
        borderColor: "#923D5D",
        data: [],
        labels: [],
    },
    precipitation: {
        label: "Атмосферные осадки",
        pointBorderColor: "#204A87",
        backgroundColor: '#204A87',
        borderColor: "#204A87",
        data: [],
        labels: [],
        hidden: true,
    },
    precipitation_forecast: {
        label: "Атмосферные осадки (прогноз)",
        pointBorderColor: "#3E93FF",
        backgroundColor: '#3E93FF',
        borderColor: "#3E93FF",
        data: [],
        labels: [],
        hidden: true,
    },
    temperature: {
        label: "Температура",
        pointBorderColor: "#009301",
        backgroundColor: '#009301',
        borderColor: "#009301",
        data: [],
        labels: [],
        hidden: true,
    },
    temperature_forecast: {
        label: "Температура (прогноз)",
        pointBorderColor: '#2B5F2C',
        backgroundColor: '#2B5F2C',
        borderColor: "#2B5F2C",
        data: [],
        labels: [],
        hidden: true,
    }
}