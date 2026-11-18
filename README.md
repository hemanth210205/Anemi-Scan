# AnemiScan

**AI-powered anemia screening from a smartphone photo of the eye conjunctiva or fingernail bed.**

AnemiScan pairs an EfficientNet-B3 deep learning model with a clinical web workflow. Health workers can capture or upload an image, get a screening result with a confidence score and risk level, see which region drove the prediction (Grad-CAM), and export a patient-ready PDF report. All of it runs in a Flask web app that works on desktop and mobile.

> ⚠️ AnemiScan is a **screening aid**, not a diagnostic device. Always confirm results with a laboratory hemoglobin test and a qualified medical professional.

---

## Features

- 🩺 **Anemia screening** from conjunctiva and fingernail images (binary: Anemic / Non-Anemic)
- 🧠 **EfficientNet-B3** transfer learning with a custom dense head and temperature-scaled confidence
- 🔥 **Grad-CAM heatmaps** that show which image region drove the prediction
- 🖼️ **Image quality checks** (blur, brightness and resolution) before inference
- 📱 **Mobile-friendly capture**: upload a file or use the device camera directly
- 🧾 **Patient history** with search, filters, sorting, pagination and CSV export
- 📊 **Analytics dashboard**: detection rate, daily scan trend, age distribution and confidence distribution
- 📄 **PDF reports** plus WhatsApp and email sharing of results
- 🔌 **REST API** (`/api/predict`) with rate limiting
- 🌗 **Light / dark theme** and a large-text accessibility mode
- 🐳 **Docker, Gunicorn and Caddy** configuration for deployment

---

## How it works

1. **Capture**: upload or photograph the eye conjunctiva or fingernail.
2. **Validate**: the image is checked for blur, lighting and size.
3. **Predict**: EfficientNet-B3 classifies the image and calibrates the confidence.
4. **Explain**: Grad-CAM highlights the region that influenced the result (optional).
5. **Record**: the scan and patient details are saved to SQLite.
6. **Report**: review the verdict, risk level and estimated hemoglobin range, then export a PDF.

---

## Tech stack

| Area | Tools |
|---|---|
| Deep learning | PyTorch, Torchvision, EfficientNet-B3, Grad-CAM |
| Image processing | OpenCV, Pillow, NumPy |
| Backend | Python 3.10, Flask, Flask-SQLAlchemy, SQLite, ReportLab |
| Frontend | HTML, Bootstrap 5, JavaScript, Chart.js, Lucide icons |
| Evaluation | scikit-learn, pandas, Matplotlib, Seaborn |
| Deployment | Docker, Docker Compose, Gunicorn, Caddy |

---

## Getting started

### Requirements

- **Python 3.10.** `torch==2.0.0` has no packages for newer Python versions such as 3.12 or 3.13.
- Git

### 1. Clone

```bash
git clone https://github.com/hemanth210205/Anemi-Scan.git
cd Anemi-Scan
```

### 2. Create a virtual environment

**Windows (PowerShell)**

```powershell
py -3.10 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

> If PowerShell blocks the activation script, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, then activate again.

**macOS / Linux**

```bash
python3.10 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Run

```bash
python app.py
```

Open **http://localhost:5000**. A trained model is included at `models/best_model.pth`, so no training is needed to try the app.

To enable Grad-CAM heatmaps (off by default to save CPU):

```powershell
# PowerShell
$env:ANEMIA_ENABLE_GRADCAM="true"; python app.py
```

```bash
# macOS / Linux
ANEMIA_ENABLE_GRADCAM=true python app.py
```

**Keyboard shortcuts:** press `N` to start a new scan and `H` to open patient history.

---

## Docker

```bash
docker compose up --build
```

The app is served on port 5000 through Gunicorn. The database, models, reports, logs, uploads and Grad-CAM folders are mounted as volumes, so data survives container restarts. Change `FLASK_SECRET_KEY` in `docker-compose.yml` before deploying.

For HTTPS (which mobile browsers require for camera access), `deploy/Caddyfile` provides a reverse-proxy config. Replace `your-domain.example.com` with your domain.

> Gunicorn does not run on Windows. On Windows, use `python app.py` or Docker.

---

## Deploy on Render

The repo includes a [`render.yaml`](render.yaml) blueprint.

1. Push the repo to GitHub.
2. In the [Render dashboard](https://dashboard.render.com), choose **New → Blueprint** and select this repository.
3. Render reads `render.yaml`, installs the CPU-only PyTorch build, and starts the app with Gunicorn. The first build takes several minutes.
4. Open the `.onrender.com` URL once the health check at `/health` passes.

Notes:

- **Memory:** the app uses about 300 MB of RAM with the model loaded, which fits the 512 MB Free/Starter plans. Grad-CAM is turned off on Render because it needs extra memory. Enable it (`ANEMIA_ENABLE_GRADCAM=true`) only on a plan with 2 GB or more.
- **Data is not persistent on the Free plan:** the SQLite database, uploads and PDF reports reset on every deploy or restart. For persistent data, use a paid plan, attach a disk (e.g. mounted at `/var/data`) and set `ANEMIA_DATABASE_PATH=/var/data/anemia_vision.db`.
- **Cold starts:** Free services sleep after 15 minutes without traffic, and the first request after that can take up to a minute while the model loads.
- **Camera capture** works because Render serves the app over HTTPS.

---

## Training and evaluation

Place your dataset in a `dataset/` folder:

```
dataset/
├── train/
│   ├── anemic/
│   └── non-anemic/
├── valid/
│   ├── Anemia/
│   └── Non_Anemia/
└── test/
    ├── Anemic/
    └── Non-anemic/
```

Folder names are matched flexibly (`anemic`, `Anemic`, `Anemia`, `non-anemic`, `Non_Anemia`, and so on).

```bash
python utils/check_dataset.py                        # validate the dataset
python train.py                                      # train
python train.py --resume models/last_checkpoint.pth  # resume training
python evaluate.py --split test                      # evaluate on the test split
```

Outputs: `models/best_model.pth`, `models/last_checkpoint.pth`, `logs/training.log` and `logs/evaluation/`. After evaluation, the metrics shown on the dashboard and About page come from your evaluation results instead of the configured defaults.

---

## API

### `POST /api/predict`

**Request**

```json
{
  "image": "<base64-encoded image>",
  "patient_name": "Aarav Kumar",
  "age": 25,
  "gender": "M",
  "phone": "9999999999",
  "image_type": "Eye Conjunctiva",
  "notes": "Fatigue for 2 weeks"
}
```

**Response**

```json
{
  "success": true,
  "scan_id": 42,
  "prediction": "Non-Anemic",
  "confidence": 0.91,
  "risk_level": "Low Risk",
  "gradcam_url": "/static/gradcam/scan_042.jpg",
  "pdf_url": "/export/pdf/42"
}
```

Rate limit: 10 requests per minute by default (`ANEMIA_RATE_LIMIT_PER_MINUTE`).

### Other routes

| Route | Purpose |
|---|---|
| `/` | Dashboard |
| `/scan` | New patient scan |
| `/result/<id>` | Screening result |
| `/history` | Patient history (search, filter, CSV export) |
| `/analytics` | Analytics dashboard |
| `/export/pdf/<id>` | Download a PDF report |
| `/about` | Model, dataset and limitations |
| `/author` | Author profile |
| `/health` | Health check |

---

## Configuration

Common environment variables (see `config.py` for the full list):

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Port the app listens on |
| `ANEMIA_ENABLE_GRADCAM` | `false` | Generate Grad-CAM heatmaps |
| `ANEMIA_RATE_LIMIT_PER_MINUTE` | `10` | API rate limit |
| `ANEMIA_TORCH_THREADS` | `1` | CPU threads for inference |
| `ANEMIA_GUNICORN_WORKERS` | `1` | Gunicorn worker count |
| `ANEMIA_DATASET_ROOT` | `dataset/` | Dataset location |
| `ANEMIA_DATABASE_PATH` | `database/anemia_vision.db` | SQLite database file |

---

## Project structure

```
Anemi-Scan/
├── app.py               # Flask app: routes, database models, API
├── config.py            # Paths, training/Flask config, author profile
├── model.py             # EfficientNet-B3 model definition
├── dataset.py           # Dataset discovery and data loaders
├── train.py             # Training pipeline
├── evaluate.py          # Evaluation and metrics
├── predict.py           # Inference helpers
├── gradcam.py           # Grad-CAM and temperature scaling
├── image_validator.py   # Image quality checks
├── pdf_report.py        # PDF report generation
├── templates/           # Jinja2 pages (dashboard, scan, result, history, analytics, about, author)
├── static/              # CSS, JavaScript, uploads, Grad-CAM images
├── models/              # Trained checkpoint and temperature scaling
├── database/            # SQLite database
├── reports/             # Generated PDF reports
├── logs/                # Training logs and plots
├── deploy/              # Caddy reverse-proxy config
├── utils/               # Dataset checker
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

---

## Roadmap

- Multi-class anemia severity prediction
- Larger and more diverse clinical dataset
- Integration with Electronic Health Records (EHR)
- Native mobile application
- Improved explainability methods

---

## Author

**Gunti Hemanth Kumar**, AI Engineer
Computer Science and Engineering graduate, Indian Institute of Information Technology, Surat

- 📧 [hk744610@gmail.com](mailto:hk744610@gmail.com)
- 💼 [linkedin.com/in/hemanth131104](https://www.linkedin.com/in/hemanth131104)
- 🐙 [github.com/hemanth210205](https://github.com/hemanth210205)

---

## License

This project is intended for academic and research purposes.

## Disclaimer

AnemiScan is intended for anemia screening assistance only and is not a replacement for professional medical diagnosis. Lighting, camera quality, motion and skin-tone variation can affect predictions, and the hemoglobin range is a rough visual estimate. Clinical decisions should always be made by qualified healthcare professionals.
