import resend

resend.api_key = "re_N6EsePh1_6jR5e4449HhfPkq6RYAzC4uK"

r = resend.Emails.send({
  "from": "onboarding@resend.dev",
  "to": "pabloillich@gmail.com",
  "subject": "Hello World",
  "html": "<p>Congrats on sending your <strong>first email</strong>!</p>"
})

print(r)
print("Email enviado")
