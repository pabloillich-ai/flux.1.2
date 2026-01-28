import os
import resend
import csv
from dotenv import load_dotenv

# Configuración inicial
load_dotenv()
resend.api_key = os.getenv("RESEND_API_KEY")

# Plantilla del Correo
SUBJECT = "Propuesta de Alianza Estratégica: Beneficios exclusivos para los socios"

HTML_TEMPLATE = """
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px;">
    <p>Estimados miembros de la <strong>{{Name1}}</strong>,</p>
    
    <p>Es un gusto saludarlos.</p>
    
    <p>Me pongo en contacto con usted en representación de <strong>REX Consulting</strong>.</p>
    
    <p>Conocemos el compromiso de <strong>{{Name1}}</strong> con el crecimiento y la profesionalización de sus asociados, y es bajo esa premisa que nos gustaría proponer un acuerdo de colaboración estratégica.</p>
    
    <p>Nuestro objetivo es poner a disposición de sus socios herramientas de gestión avanzada y consultoría experta con condiciones preferenciales, ayudándoles a optimizar su flujo de caja, estructura de costos y talento humano.</p>
    
    <p>A continuación, detallo los pilares de valor que integrarían este beneficio:</p>
    
    <ul style="padding-left: 20px;">
        <li style="margin-bottom: 8px;"><strong>Conect Pulse (Software de Cobranzas):</strong> Digitalización y automatización integral de la gestión de cobros para maximizar la liquidez sin modificar ni migrar su estructura técnica ni humana.</li>
        <li style="margin-bottom: 8px;"><strong>Consultoría y Gestión de Proyectos:</strong> Acompañamiento metodológico por expertos senior garantizados, para asegurar la ejecución exitosa de iniciativas críticas de negocio.</li>
        <li style="margin-bottom: 8px;"><strong>Búsqueda de Personal (Recruitment):</strong> Selección especializada con acompañamiento incluido para desarrollar en conjunto el mejor perfil que se ajuste a la empresa, su cultura y las tareas, achatando la curva de aprendizaje y maximizando la adopción.</li>
        <li style="margin-bottom: 8px;"><strong>Fractional C-Level:</strong> Acceso a directivos senior (CFO, CTO, CMO) bajo demanda, permitiendo que las empresas tengan visión estratégica de alto nivel sin los costos de una estructura fija full-time.</li>
    </ul>
    
    <p><strong>¿Qué ofrecemos a los socios?</strong> Hemos diseñado un esquema de importantes descuentos exclusivos y beneficios de implementación (como diagnósticos iniciales sin costo, implementaciones con hasta 75% de descuento, beneficios por múltiples servicios, entre otros) diseñados específicamente para los miembros de su institución, facilitando su acceso a servicios que suelen ser complejos de contratar individualmente.</p>
    
    <p>Me encantaría poder coordinar una breve reunión o llamada de 15 minutos la próxima semana para presentarle los detalles de esta propuesta y cómo podemos formalizar este beneficio para su comunidad de empresas.</p>
    
    <p>Quedo a su entera disposición.</p>
    
    <p>Atentamente,</p>
    
    <div style="margin-top: 25px; pt: 15px; border-top: 1px solid #ddd; color: #555;">
        <p style="margin-bottom: 0;"><strong>Juan Pedro Galarza</strong></p>
        <p style="margin: 0;">Director REX Consulting</p>
        <p style="margin: 0;">📞 091692431</p>
        <p style="margin: 0;">🌐 <a href="https://rexconsultinguy.com" style="color: #007bff; text-decoration: none;">rexconsultinguy.com</a></p>
    </div>
</div>
"""

def load_recipients_from_csv(file_path):
    """
    Lee el archivo CSV y extrae Name1 y Email.
    """
    recipients = []
    try:
        with open(file_path, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('Email') and row.get('Name1'):
                    recipients.append({
                        'email': row['Email'].strip(),
                        'name': row['Name1'].strip()
                    })
    except Exception as e:
        print(f"❌ Error al leer el CSV: {e}")
    return recipients

def send_invitation_emails(recipients):
    """
    Envía los correos personalizados.
    """
    if not recipients:
        print("⚠️ No hay destinatarios para procesar.")
        return

    print(f"--- Iniciando envío de {len(recipients)} correos ---")
    
    for person in recipients:
        email = person['email']
        name = person['name']
        
        personalized_html = HTML_TEMPLATE.replace("{{Name1}}", name)
        
        try:
            print(f"Enviando a: {name} <{email}>...")
            
            # Recordatorio: mientras estés en modo 'onboarding', solo funcionará tu propio mail verificado.
            # Cuando verifiques el dominio, cambia a: "Juan Pedro Galarza <juan@rexconsultinguy.com>"
            r = resend.Emails.send({
                "from": "REX Consulting <onboarding@resend.dev>",
                "to": email,
                "subject": SUBJECT,
                "html": personalized_html
            })
            
            print(f"✅ Enviado: {r.get('id')}")
            
        except Exception as e:
            print(f"❌ Error con {email}: {e}")

if __name__ == "__main__":
    CSV_PATH = os.path.join(os.path.dirname(__file__), "Mailing1.csv")
    
    if not resend.api_key:
        print("⚠️ Error: No se encontró la RESEND_API_KEY en el archivo .env")
    else:
        socios = load_recipients_from_csv(CSV_PATH)
        send_invitation_emails(socios)

