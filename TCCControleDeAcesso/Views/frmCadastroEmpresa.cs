using System;
using System.Net.Mail;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
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
        public static String EmailDest;
        CadastroEmpresas _cadastroEmpresas;
        public frmCadastroEmpresa()
        {
            InitializeComponent();
        }

        private void CleanAll()
        {
            txtConfirmarSenha.Clear();
            txtEmail.Clear();
            txtNome.Clear();
            txtSenha.Clear();
            txtNome.Focus();
        }

        private void btnCadastrar_Click(object sender, EventArgs e)
        {

            _cadastroEmpresas = new CadastroEmpresas()
            {
                Email = txtEmail.Text,
                Name = txtNome.Text,
                Senha = txtSenha.Text,
            };
            //_cadastroEmpresas.Insert();
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
                string.IsNullOrWhiteSpace(txtConfirmarSenha.Text)) //verificando se todos os campos foram preenchidos e alertando caso não 
            {
                MessageBox.Show("Todos os campos devem ser preenchidos corretamente!", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }



            if (txtSenha.Text == txtConfirmarSenha.Text)
            {



                ////Código que cadastra o email no banco de dados!!!!       --------------->    _cadastroEmpresas.Insert();
                ///
                //Evitando o click mais de uma vez
                btnCadastrar.Enabled = false;
                //Evitando o click mais de uma vez 
                String from, pass, messageBody;
                Random rand = new Random();
                randomCode = (rand.Next(99999999)).ToString();
                textBox1.Text = randomCode;///////////////////////////// !!!!!!!!
                MailMessage message = new MailMessage();
                from = "suportehelpus@gmail.com"; //Email do remetente
                pass = "vwec abnc veyc jvns"; //Senha de App
                messageBody = "Estamos felizes de termos você conosco! Seu código de ativação de conta é: " + randomCode;
                EmailDest = txtEmail.Text; // Obtendo o e-mail do destinatário  

                // fazendo verificação se o email é algum email válido e existente
                try
                {
                    MailAddress mailadress; 
                     mailadress = new MailAddress(EmailDest);// endereço de email onde vai ser enviado o código
                    MessageBox.Show("Para a ativação de conta estamos enviando um código de verificação no seu email! " +
                   " Olhe o seu email e caixa de Spam! ", "Ativação de conta ", MessageBoxButtons.OK, MessageBoxIcon.Information);

                    message.To.Add(EmailDest);
                    message.From = new MailAddress(from);
                    message.Body = messageBody;
                    message.Subject = "Bem vindo ao HelpUS! ";
                    SmtpClient smtp = new SmtpClient("smtp.gmail.com");
                    smtp.EnableSsl = true;
                    smtp.Port = 587;
                    smtp.DeliveryMethod = SmtpDeliveryMethod.Network;
                    smtp.Credentials = new NetworkCredential(from, pass);

                    /////////////// passando Variaveis para o outro form
                    var frmAC = new frmAtivacaoConta(txtNome.Text, txtEmail.Text, txtSenha.Text);
                    frmAC.propriedade = textBox1.Text;
                    this.Hide();
                    frmAC.Show();
                    ///////////////

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
                }

                catch (Exception ex)
                {
                    MessageBox.Show("Endereço de email inválido!");
                    btnCadastrar.Enabled = true;//reativando o botão de cadastro
                }

            }

            else
            {
                MessageBox.Show("As Senhas Não Coincidem", "Erro No Login", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }


        }

        private void frmCadastroEmpresa_Load(object sender, EventArgs e)
        {
            CleanAll();
        }


    }
}
