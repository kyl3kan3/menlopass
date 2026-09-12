"""Package all peri icons from the shared master assets."""
from pathlib import Path
import subprocess
subprocess.run(["node", "mobile/scripts/generate-brand-assets.cjs"], cwd=Path(__file__).resolve().parent, check=True)
