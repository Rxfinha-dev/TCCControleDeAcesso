using System;
using System.Net;
using System.Net.Mail;
using System.Windows.Forms;
using Org.BouncyCastle.Crypto.Macs;


namespace TCCControleDeAcesso.Views
{
    public partial class frmNovaSenha : Form
    {
        public frmNovaSenha()
        {
            InitializeComponent();
        }

        private void btnEnviarEmail_Click(object sender, EventArgs e)
        {
            //Evitando o click mais de uma vez
            btnEnviarEmail.Enabled = false;
            //Auto-Explicativo ne 
            string EmailDestinatario = txtEmailDestinatario.Text;
            //Assunto(Tenho que ver uma maneira de fazer essa parte ficar oculta e preenche-la automaticamente)
            string EmailAssunto = txtEmailAssunto.Text;
            //Mensagem
            string EmailMensagem = txtEmailMensagem.Text;
            //
            MailMessage mail = new MailMessage();

            mail.From = new MailAddress("Carlosandregamer2000@gmail.com");//De onde vai sair o email

            mail.To.Add(EmailDestinatario);//Para onde vai chegar o Email

            mail.Body = EmailMensagem; //Mensagem

            using (var smtp = new SmtpClient("smtp.gmail.com", 587))

            {
                smtp.UseDefaultCredentials = false;
                smtp.EnableSsl = true;
                smtp.Credentials = new NetworkCredential("Carlosandregamer2000@gmail.com", "carl0sandr5");//se der erro exclui a parte da senha 

                try // Tentando realizar o envio do email  
                {
                    smtp.Send(mail);

                    MessageBox.Show("E-mail enviado!");

                    txtEmailDestinatario.Text = string.Empty;
                    txtEmailAssunto.Text = string.Empty;
                    txtEmailMensagem.Text = string.Empty;
                    btnEnviarEmail.Enabled = true;
                }

                catch (Exception ex)
                {
                    MessageBox.Show(ex.Message, ("Falha ao enviar o E-mail"));


                }
            }



        }
    }
}
