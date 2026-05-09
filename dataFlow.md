Backend :
1) entry point -> server.js -> connectDB & create app

    2) DB -> end

    2) app -> node routes & demoStreamRoutes & ErrorHandler

        3) node routes -> NodeController & Validate.js

            4) Node Controller -> Uses Models (Node and telemetry)

                5) Telemetry Model -> end

                5) Node Model -> end

            4) Validate.js -> end (middleware)

        3) demoStreamRoutes -> Uses Models (Node and telemetry)

            4) Telemetry Model -> end

            4) Node Model -> end
        
        3) ErrorHandler -> end (middleware)