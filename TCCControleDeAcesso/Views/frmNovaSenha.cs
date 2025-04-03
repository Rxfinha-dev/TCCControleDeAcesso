using System;
using System.Net;
using System.Net.Mail;
using System.Windows.Forms;



namespace TCCControleDeAcesso.Views
{
    public partial class frmNovaSenha : Form
    {
        String randomCode;
        public static String to;

        public frmNovaSenha()
        {
            InitializeComponent();
        }

        private void btnEnviarEmail_Click(object sender, EventArgs e)
        {
            //Evitando o click mais de uma vez
            btnEnviarEmail.Enabled = false;
            String from, pass, messageBody;
            Random rand = new Random();
            randomCode = (rand.Next(999999)).ToString();
            MailMessage message = new MailMessage();                    //txtEmail do cara = meu txtEmailDestinatario
            from = "suportehelpus@gmail.com"; //Email do remetente
            pass = "vwec abnc veyc jvns"; //Senha do remetente
            messageBody = "Seu código de verificação é: " + randomCode;
            to = txtEmailDestinatario.Text; // Obtendo o e-mail do destinatário
            message.To.Add(to);
            to = txtEmailDestinatario.Text; // Obtendo o e-mail do destinatário
            message.To.Add(to);
            message.From = new MailAddress(from);
            message.Body = messageBody;
            message.Subject = "Recuperação de Senha";
            SmtpClient smtp = new SmtpClient("smtp.gmail.com");
            smtp.EnableSsl = true;
            smtp.Port = 587;
            smtp.DeliveryMethod = SmtpDeliveryMethod.Network;
            smtp.Credentials = new NetworkCredential(from, pass);

            try
            {
                smtp.Send(message);
                MessageBox.Show("Código de verificação enviado com sucesso!");
                //reativando o btnEnviarEmail
                btnEnviarEmail.Enabled = true;

            }

            catch (Exception ex)
            {
                MessageBox.Show(ex.Message);
                //reativando o btnEnviarEmail
                btnEnviarEmail.Enabled = true;
            }
        }

        private void btnVerify_Click(object sender, EventArgs e)
        {
            if (randomCode == (txtCodeVerify.Text).ToString())
            {
                to = txtEmailDestinatario.Text;
                frmTrocandoSenha rp = new frmTrocandoSenha();
                this.Hide();
                rp.Show();

            }
           else
            {
                MessageBox.Show("Código de verificação inválido, tente novamente.");
            }
        }
    }
}

