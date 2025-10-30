# 🌊 RiverEye - Smart Flood Monitoring System

RiverEye is a comprehensive flood monitoring and early warning system built for Smart India Hackathon (SIH). It combines IoT hardware with a modern web dashboard to provide real-time water level monitoring, weather tracking, and automated alert systems for flood-prone areas.

## 🚀 Features

### 📊 Real-time Monitoring Dashboard
- **Water Level Tracking**: Live water level monitoring with historical data visualization
- **Flow Rate Analysis**: Real-time water flow measurements with directional indicators
- **Weather Integration**: Current weather conditions and 24-hour forecasts
- **Interactive Maps**: Google Maps integration showing flood monitoring hardware locations

### 🔔 Smart Alert System
- **Multi-level Warnings**: Warning and critical level alerts
- **SMS Notifications**: Automated SMS alerts via Fast2SMS API
- **Tamper Detection**: Hardware security monitoring
- **Real-time Status Updates**: Live system health monitoring

### 📱 Responsive Web Interface
- **Dashboard Overview**: Comprehensive monitoring dashboard with charts
- **Weather Forecasting**: Detailed weather data and predictions
- **Device Health**: Hardware status and connectivity monitoring
- **Historical Data**: Time-series data visualization with Chart.js

## 🏗️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Chart.js** - Data visualization
- **Lucide React** - Icon library

### Backend & APIs
- **Next.js API Routes** - Serverless API endpoints
- **OpenWeather API** - Weather data integration
- **Google Maps API** - Interactive mapping
- **Fast2SMS API** - SMS notification service

### Hardware Integration
- **ESP32 Microcontroller** - IoT data collection
- **Water Level Sensors** - Ultrasonic/pressure sensors
- **Flow Rate Sensors** - HB100 doppler radar sensor
- **MPU6050** - Accelerometer for tamper detection
- **RTC Module** - Real-time clock
- **SD Card** - Local data logging

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Environment Variables
Create a `.env.local` file in the root directory:

```env
# OpenWeather API (for weather data)
NEXT_PUBLIC_OPENWEATHER_KEY=your_openweather_api_key

# Google Maps API (for mapping features)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# ESP32 Hardware URL (your device IP)
NEXT_PUBLIC_ESP32_URL=http://your_esp32_ip/data

# Fast2SMS API (for SMS alerts)
FAST2SMS_API_KEY=your_fast2sms_api_key
FAST2SMS_SENDER_ID=your_sender_id

# Alert Phone Number
NEXT_PUBLIC_ALERT_PHONE=your_phone_number
```

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/PrinceYadav001/RiverEye.git
   cd RiverEye
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Dashboard layout group
│   │   ├── overview/            # Main monitoring dashboard
│   │   ├── weather/             # Weather monitoring page
│   │   ├── device/              # Hardware status page
│   │   └── maps/                # Interactive maps
│   ├── api/                     # API routes
│   │   ├── esp32/               # ESP32 data proxy
│   │   ├── log/                 # Data logging
│   │   └── send-sms/            # SMS notification service
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── components/                   # React components
│   ├── ui/                      # Reusable UI components
│   ├── app-sidebar.tsx          # Navigation sidebar
│   └── header.tsx               # Application header
├── hooks/                       # Custom React hooks
├── lib/                         # Utility functions
└── ...
logs/                            # Data logging directory
public/                          # Static assets
```

## 🌐 API Endpoints

### ESP32 Data
- **GET** `/api/esp32` - Fetch real-time sensor data
- **POST** `/api/log` - Store sensor data logs
- **GET** `/api/log` - Retrieve historical data

### SMS Alerts
- **POST** `/api/send-sms` - Send SMS notifications

## 📊 Dashboard Features

### Overview Page
- Real-time water level and flow rate monitoring
- Interactive charts with historical data
- Weather integration with rainfall data
- Alert status indicators
- Automated SMS notifications

### Weather Page
- Current weather conditions for any Indian city
- 24-hour temperature, humidity, and rainfall forecasts
- Interactive weather charts
- OpenWeather API integration

### Device Health Page
- ESP32 connectivity status
- Sensor health monitoring (WiFi, RTC, SD Card, MPU)
- Real-time system diagnostics
- Hardware tamper detection

### Maps Page
- Interactive Google Maps integration
- Flood monitoring site locations
- Hardware deployment visualization
- Geographic context for monitoring areas

## 🔧 Hardware Configuration

The system works with ESP32-based flood monitoring hardware that provides:

- **Water Level Measurement**: Ultrasonic or pressure sensors
- **Flow Rate Detection**: HB100 doppler radar sensor
- **Environmental Monitoring**: Temperature, humidity sensors
- **Security Features**: MPU6050 accelerometer for tamper detection
- **Data Logging**: SD card storage with RTC timestamps
- **Connectivity**: WiFi for real-time data transmission

## 📱 SMS Alert System

Automated SMS notifications are sent when:
- Water level exceeds warning threshold
- Critical flood level is reached
- Hardware tampering is detected
- System connectivity issues occur

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The application can be deployed on any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Smart India Hackathon

This project was developed for Smart India Hackathon (SIH) focusing on flood monitoring and early warning systems. It addresses the critical need for real-time flood monitoring infrastructure in India's flood-prone regions.

## 📞 Support

For support and queries:
- Create an issue in this repository
- Contact: [your-email@domain.com]

## 🙏 Acknowledgments

- Smart India Hackathon organizers
- OpenWeather API for weather data
- Google Maps Platform for mapping services
- Fast2SMS for SMS notification services
- All team members and contributors

---

**Built with ❤️ for Smart India Hackathon by Team RiverEye**
