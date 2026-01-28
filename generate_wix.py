
import os

def generate_wix_embed():
    desktop_path = r"c:\Users\Usuario\OneDrive\Desktop\Cobranza"
    html_path = os.path.join(desktop_path, "Maindemo.html")
    b64_path = os.path.join(desktop_path, "logo_b64.txt")
    output_path = os.path.join(desktop_path, "Wix_Embed.html")

    # Read HTML
    with open(html_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    # Read Base64
    with open(b64_path, "r", encoding="utf-8") as f:
        b64_lines = f.readlines()

    # Clean Base64 (remove headers/footers if present)
    clean_b64 = ""
    for line in b64_lines:
        if "BEGIN" in line or "END" in line:
            continue
        clean_b64 += line.strip()

    # Create Data URI
    data_uri = f"data:image/png;base64,{clean_b64}"

    # Replace
    new_html = html_content.replace('src="public/logo_pulse.png"', f'src="{data_uri}"')

    # Add comment for Wix User
    wix_intro = "<!-- COPY EVERYTHING BELOW THIS LINE TO WIX HTML EMBED -->\n"
    final_content = wix_intro + new_html

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(final_content)

    print(f"Successfully created {output_path}")

if __name__ == "__main__":
    generate_wix_embed()
