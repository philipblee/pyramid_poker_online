import os
import subprocess
from pathlib import Path

# Create output directory
Path("generated-pdfs").mkdir(exist_ok=True)

# Convert all .md files
for md_file in Path(".").glob("*.md"):
    pdf_file = f"generated-pdfs/{md_file.stem}.pdf"
    subprocess.run(["pandoc", str(md_file), "-o", pdf_file])
    print(f"Converted {md_file.name}")