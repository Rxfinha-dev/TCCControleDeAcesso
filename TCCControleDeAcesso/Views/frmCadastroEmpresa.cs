using System;
using System.Net.Mail;
using BCrypt.Net;
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
using Org.BouncyCastle.Crypto.Generators;
using System.Security.Cryptography;

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
            // acredito que seja esse comando o responsavel pelo envio dos campos para o banco de dados
            _cadastroEmpresas = new CadastroEmpresas()
            {
                Email = txtEmail.Text.Trim(),
                Name = txtNome.Text.Trim(),
                Senha = txtSenha.Text,
            };

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

            if (string.IsNullOrWhiteSpace(txtNome.Text) ||
                string.IsNullOrWhiteSpace(txtEmail.Text) ||
                string.IsNullOrWhiteSpace(txtSenha.Text) ||
                string.IsNullOrWhiteSpace(txtConfirmarSenha.Text))
            {
                MessageBox.Show("Todos os campos devem ser preenchidos corretamente!", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            if (txtSenha.Text == txtConfirmarSenha.Text)
            {

                ////------------------Vamos tentar implementar A hash (que está com a salt key incluido ja)------------------//
                string senha = txtSenha.Text.Trim();
                

                // gera hash com salt automático (interno do bcrypt)
                // bcrypt é uma biblioteca importada
                string hash = BCrypt.Net.BCrypt.HashPassword(senha);

                // hash que vai ser armazenado no banco:
                // tenhamos em mente que estamos pegando o valor da hash que foi gerada juntamente com o SaltKey e estamos atribuindo +
                // ela novamente ao campo txtSenha para poder enviarmos ela ao banco de dados sem problemas

                // enviando a hash através de um txtbox invisível 
                txtEnvioHash.Text = hash;

                ////------------------fim da implementação------------------//

                // esse daqui evita q o usuário fique dando vários cliques
                btnCadastrar.Enabled = false;

                // Gerando código aleatório
                String from, pass, messageBody;
                Random rand = new Random();
                randomCode = (rand.Next(99999999)).ToString();
                textBox1.Text = randomCode;

                MailMessage message = new MailMessage();
                from = "suportehelpus@gmail.com"; // Email do remetente
                pass = "vwec abnc veyc jvns";     // Senha de App


                messageBody = "Estamos felizes de termos você conosco! Seu código de ativação de conta é: " + randomCode;
                EmailDest = txtEmail.Text;

                try
                {
                    MailAddress mailadress = new MailAddress(EmailDest);    

                    MessageBox.Show("Para a ativação de conta estamos enviando um código de verificação no seu email! " +
                        "Olhe o seu email e caixa de Spam!", "Ativação de conta", MessageBoxButtons.OK, MessageBoxIcon.Information);

                    message.To.Add(EmailDest);
                    message.From = new MailAddress(from);
                    message.Body = messageBody;
                    message.Subject = "Bem vindo ao HelpUS! ";

                    SmtpClient smtp = new SmtpClient("smtp.gmail.com");
                    smtp.EnableSsl = true;
                    smtp.Port = 587;
                    smtp.DeliveryMethod = SmtpDeliveryMethod.Network;
                    smtp.Credentials = new NetworkCredential(from, pass);

                    // Criando a tela de ativação
                    var frmAC = new frmAtivacaoConta(txtNome.Text, txtEmail.Text, txtEnvioHash.Text);
                    frmAC.propriedade = textBox1.Text;

                    // Abre a tela de carregamento, passando a de ativação como destino
                    frmAC.propriedade = textBox1.Text;
                    this.Hide();
                    frmAC.Show();

                    try
                    {
                        smtp.Send(message);
                        btnCadastrar.Enabled = true;
                        txtSenha.Clear();
                        txtConfirmarSenha.Clear();
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show(ex.Message);
                        btnCadastrar.Enabled = true;
                        txtSenha.Clear();
                        txtConfirmarSenha.Clear();
                    }
                }
                catch (Exception)
                {
                    MessageBox.Show("Endereço de email inválido!");
                    btnCadastrar.Enabled = true;
                    txtSenha.Clear();
                    txtConfirmarSenha.Clear();
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
            txtSenha.PasswordChar = '*';
            txtConfirmarSenha.PasswordChar = '*';
            CleanAll();
        }
    }
}
