using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Net.Mail;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using MySql.Data.MySqlClient;
using TCCControleDeAcesso.Models;

namespace TCCControleDeAcesso.Views
{
    public partial class frmCadastroEmpresa : Form
    {
        String randomCode;
        public static String to;
        CadastroEmpresas _cadastroEmpresas;
        public frmCadastroEmpresa()
        {
            InitializeComponent();
        }

        private void btnCadastrar_Click(object sender, EventArgs e)
        {
            int count = 0;
            try
            {

                Banco.OpenConnection();


                Banco.Command = new MySqlCommand("SELECT COUNT(*) FROM escolas WHERE email=@email", Banco.Connection);


                Banco.Command.Parameters.AddWithValue("@email", txtEmail.Text);



                count = Convert.ToInt32(Banco.Command.ExecuteScalar());

                Banco.CloseConnection();

                if (count > 0)
                {
                    MessageBox.Show("Esse Email já está cadastrado! ", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
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

            _cadastroEmpresas = new CadastroEmpresas()
            {
                Name = txtNome.Text,
                Email = txtEmail.Text,
                Senha = txtSenha.Text,
            };

            if (string.IsNullOrWhiteSpace(txtNome.Text) ||
                string.IsNullOrWhiteSpace(txtEmail.Text) ||
                string.IsNullOrWhiteSpace(txtSenha.Text) ||
                string.IsNullOrWhiteSpace(txtConfirmarSenha.Text)) //verificando se os campos estão vazios 
            {
                MessageBox.Show("Todos os campos devem ser preenchidos corretamente!", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }



            if (txtSenha.Text == txtConfirmarSenha.Text ) 
            {
                ////Código que cadastra o email no banco de dados!!!!       --------------->    _cadastroEmpresas.Insert();
                MessageBox.Show("Para a ativação de conta estamos enviando um código de verificação no seu email! " +
                    " Olhe o seu email e caixa de Spam! ", "Ativação de conta ", MessageBoxButtons.OK, MessageBoxIcon.Information);

                /////////////////////
                ///


                //Evitando o click mais de uma vez
                btnCadastrar.Enabled = false;
                String from, pass, messageBody;
                Random rand = new Random();
                randomCode = (rand.Next(99999999)).ToString();
                MailMessage message = new MailMessage();                    //txtEmail do cara = meu txtEmailDestinatario
                from = "suportehelpus@gmail.com"; //Email do remetente
                pass = "vwec abnc veyc jvns"; //Senha de App
                messageBody = "Estamos felizes de termos você conosoco! Seu código de ativação de conta é: " + randomCode;
                to = txtEmail.Text; // Obtendo o e-mail do destinatário  
                message.To.Add(to);
                message.From = new MailAddress(from);
                message.Body = messageBody;
                message.Subject = "Bem vindo ao HelpUS! ";
                SmtpClient smtp = new SmtpClient("smtp.gmail.com");
                smtp.EnableSsl = true;
                smtp.Port = 587;
                smtp.DeliveryMethod = SmtpDeliveryMethod.Network;
                smtp.Credentials = new NetworkCredential(from, pass);
                frmAtivacaoConta rp = new frmAtivacaoConta();
                this.Hide();
                rp.Show();

                

                try
                {
                    smtp.Send(message);
                    //reativando o btnEnviarEmail
                    btnCadastrar.Enabled = true;

                }

                catch (Exception ex)
                {
                    MessageBox.Show(ex.Message);
                    //reativando o btnEnviarEmail
                    btnCadastrar.Enabled = true;
                }



                ///
                /////////////////////

            }

            else
            {
                MessageBox.Show("As Senhas Não Coincidem", "Erro No Login", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
        }


    }
}
