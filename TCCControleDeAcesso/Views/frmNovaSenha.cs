using System;
using System.Net;
using System.Net.Mail;
using System.Windows.Forms;
using MySql.Data.MySqlClient;
using TCCControleDeAcesso.Models;
using System.Runtime.InteropServices;
using System.Drawing;

namespace TCCControleDeAcesso.Views
{
    public partial class frmNovaSenha : Form
    {

        [DllImport("Gdi32.dll", EntryPoint = "CreateRoundRectRgn")]

        private static extern IntPtr CreateRoundRectRgn
           (
               int nLeft,
               int nTop,
               int nRight,
               int nBottom,
               int nWidthEllipse,
               int nHeightEllipse
           );

        String randomCode;
        public static String to;

        public frmNovaSenha()
        {
            InitializeComponent();
        }

        private void btnEnviarEmail_Click(object sender, EventArgs e)
        {
            int count;
            try
            {

                Banco.OpenConnection();


                Banco.Command = new MySqlCommand("SELECT COUNT(*) FROM escolas WHERE email=@email", Banco.Connection);


                Banco.Command.Parameters.AddWithValue("@email", txtEmailDestinatario.Texts);
                


                count = Convert.ToInt32(Banco.Command.ExecuteScalar());

                Banco.CloseConnection();

                if (count > 0)
                {

                    //Evitando o click mais de uma vez
                    btnEnviarEmail.Enabled = false;
                    String from, pass, messageBody;
                    Random rand = new Random();
                    randomCode = (rand.Next(999999)).ToString();
                    MailMessage message = new MailMessage();                    //txtEmail do cara = meu txtEmailDestinatario
                    from = "suportehelpus75@gmail.com"; // Email do remetente
                    pass = "raot mngl bxqx hceb";     // Senha de App
                    messageBody = "Seu código de verificação é: " + randomCode;
                    to = txtEmailDestinatario.Texts; // Obtendo o e-mail do destinatário
                    message.To.Add(to);                                                                 //deu erro == Escrever a linha de cima e essa novamente
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
                else
                {
                    MessageBox.Show("Email não Cadastrado.", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message, "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                Banco.CloseConnection();
            }
        }

        private void btnVerify_Click(object sender, EventArgs e)
        {
            if (randomCode == (txtCodeVerify.Texts).ToString())
            {
                to = txtEmailDestinatario.Texts;
                frmTrocandoSenha rp = new frmTrocandoSenha(txtEmailDestinatario.Texts);
                this.Hide();
                rp.Show();

            }
           else
            {
                MessageBox.Show("Código de verificação inválido, tente novamente.", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error);
                txtCodeVerify.Texts = "";
            }
        }

        private void CentralizarControles()
        {
            btnEnviarEmail.Left = (this.ClientSize.Width - btnEnviarEmail.Width) / 2;
            btnVerify.Left = (this.ClientSize.Width - btnVerify.Width) / 2;
        }

        private void panel1_Paint(object sender, PaintEventArgs e)
        {

        }

        private void frmNovaSenha_Load(object sender, EventArgs e)
        {
            btnEnviarEmail.Region = System.Drawing.Region.FromHrgn(CreateRoundRectRgn(0, 0, btnVerify.Width, btnVerify.Height, 20, 20));
            btnVerify.Region = System.Drawing.Region.FromHrgn(CreateRoundRectRgn(0, 0, btnVerify.Width, btnVerify.Height, 20, 20));
            panel1.Region = System.Drawing.Region.FromHrgn(CreateRoundRectRgn(0, 0, panel1.Width, panel1.Height, 30, 30));

            btnEnviarEmail.FlatStyle = FlatStyle.Flat;
            btnEnviarEmail.FlatAppearance.BorderSize = 1;  // sem borda
            btnEnviarEmail.BackColor = Color.FromArgb(52, 188, 251); // #34BCFB
            btnEnviarEmail.ForeColor = Color.White; // texto branco

            btnVerify.FlatStyle = FlatStyle.Flat;
            btnVerify.FlatAppearance.BorderSize = 1;  // sem borda
            btnVerify.BackColor = Color.FromArgb(52, 188, 251); // #34BCFB
            btnVerify.ForeColor = Color.White; // texto branco

            btnVoltar.Cursor = Cursors.Hand;

        }

        private void btnVoltar_Click(object sender, EventArgs e)
        {
            this.Close();
            frmLogin frmLogin = new frmLogin();
            frmLogin.ShowDialog();
        }
    }
}



