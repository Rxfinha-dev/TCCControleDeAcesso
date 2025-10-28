using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Linq;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using TCCControleDeAcesso.Controllers;
using TCCControleDeAcesso.Models;

namespace TCCControleDeAcesso.Views
{
    public partial class frmLogin : Form
    {
        Login _login;
        CadastroEmpresas _empresas;

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

        // Variáveis de controle
        int baseY;
        double angle = 0;
        int amplitude = 5; // altura do "flutuar"
        double speed = 0.1;

        Image senha_visivel = Properties.Resources.olho_aberto;
        Image senha_invisivel = Properties.Resources.olho_fechado_24;

        // DECLARAÇÃO ÚNICA DA VARIÁVEL senhaVisivel
        private bool senhaVisivel = false;


        public frmLogin()
        {
            InitializeComponent();
        }


        private void CleanAll()
        {
            txtLoginAntigo.Clear();
            txtSenhaAntigo.Clear();
            txtLoginAntigo.Focus();
        }


        private void btnEntrar_Click(object sender, EventArgs e)
        {
            _login = new Login()
            {
                email = txtLogin.Text,
                senha = txtSenha.Text,

            };



            //estou a fazer isso aqui :


            // --------- login ---------
            //aqui vamos ter a parte de login com hash e salt key sempre tentando seguir a lógica do bcrypt.net
            //essa lógica seria gerar uma hash que ja vai estar junto da saltkey e em seguida o próprio Bycript tbm ja faz a leitura e validação,
            //sendo assim, desnecessário realizar o save da salt key de forma separada no banco de dados para validação posterior

            //vamos chamar a função do banco de dados(login.Cs) que vai puxar a senha do banco

            _login.PullSenha();

            //pega a senha digitada e guarda na variável 
            string senhadigitada = txtSenha.Text;


            if (_login.count == 1)
            {
                ////  verifica automaticamente se a senha digitada gera o mesmo hash
                bool valido = BCrypt.Net.BCrypt.Verify(senhadigitada, _login.HashBanco);

                if (valido == true)
                {
                    _login.LoginPermissions();
                    MessageBox.Show("Login realizado com sucesso!", "Sucesso", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    frmMainMenu check = new frmMainMenu(_login.nome, _login.idEscola);
                    check.Show();
                    Hide();
                    CleanAll();
                }
                else
                {
                    MessageBox.Show("Senha incorreta!", "Erro de Login");
                }

            }
            else
            {
                MessageBox.Show("Email inexistente", "Email Não encontrado");
                CleanAll();
            }





            /////////// ---------- end login --------- //
            CleanAll();


        }


        private void CentralizarControles()
        {
            button5.Left = (this.ClientSize.Width - button5.Width) / 2;
            btnEntrar.Left = (this.ClientSize.Width - btnEntrar.Width) / 2;
        }

        private void linkLabel2_LinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
        {
            frmCadastroEmpresa check = new frmCadastroEmpresa();
            check.Show();
            Hide();
        }


        private void frmLogin_Load(object sender, EventArgs e)
        {
            Banco.CreateDatabase();

            // Configura animação suave do PictureBox
            baseY = pictureBox3.Top;
            Timer flutuarTimer = new Timer();
            flutuarTimer.Interval = 18;
            flutuarTimer.Tick += (s, ev) =>
            {
                angle += speed;
                pictureBox3.Top = baseY + (int)(Math.Sin(angle) * amplitude);
            };
            flutuarTimer.Start();

            // Configuração inicial dos campos
            txtSenha.PasswordChar = true; // Oculta o texto
            txtLogin.Text = "Digite seu Login";
            txtLogin.ForeColor = Color.Gray;
            txtSenha.Text = "Digite sua Senha";
            txtSenha.ForeColor = Color.Gray;

            // Configuração visual dos botões
            button5.FlatStyle = FlatStyle.Flat;
            button5.FlatAppearance.BorderSize = 1;
            button5.FlatAppearance.BorderColor = Color.FromArgb(52, 188, 251);
            button5.BackColor = Color.FromArgb(52, 188, 251); // Fundo transparente
            button5.ForeColor = Color.White; // Texto azul

            btnEntrar.FlatStyle = FlatStyle.Flat;
            btnEntrar.FlatAppearance.BorderSize = 1;
            btnEntrar.BackColor = Color.FromArgb(52, 188, 251);
            btnEntrar.ForeColor = Color.White;

            button5.Region = Region.FromHrgn(CreateRoundRectRgn(0, 0, button5.Width, button5.Height, 20, 20));
            btnEntrar.Region = Region.FromHrgn(CreateRoundRectRgn(0, 0, btnEntrar.Width, btnEntrar.Height, 20, 20));

            // No frmLogin_Load
            picOlho.SizeMode = PictureBoxSizeMode.CenterImage; // ou Zoom conforme preferir
            picOlho.Image = Properties.Resources.olho_fechado_24; // imagem inicial (senha oculta)
            picOlho.Cursor = Cursors.Hand;
        }

        private void picOlho_Click(object sender, EventArgs e)
        {
            if (senhaVisivel)
            {
                txtSenha.PasswordChar = true; // RJTextBox: bool
                picOlho.Image = Properties.Resources.olho_fechado_24;
                senhaVisivel = false;
            }
            else
            {
                txtSenha.PasswordChar = false;
                picOlho.Image = Properties.Resources.olho_aberto;
                senhaVisivel = true;
            }
        }


        private void button5_Click(object sender, EventArgs e)
        {
            frmNovaSenha form = new frmNovaSenha();//IMPORTANTE---------------depois altere isso de volta para o "frmNovaSenha"
            form.Show();
            Hide();
        }


        private void txtLogin_Leave_1(object sender, EventArgs e)
        {
            if (txtLoginAntigo.Text == "")
            {
                txtLoginAntigo.Text = "Digite seu Login";
                txtLoginAntigo.ForeColor = Color.Gray;
            }
        }

        private void txtLogin_Enter_1(object sender, EventArgs e)
        {
            if (txtLoginAntigo.Text == "Digite seu Login")
            {
                txtLoginAntigo.Text = "";
                txtLoginAntigo.ForeColor = Color.Gray;
            }
        }

        private void txtSenha_Leave_1(object sender, EventArgs e)
        {
            if (txtSenha.Text == "")
            {
                txtSenha.Text = "Digite sua Senha";
                txtSenha.ForeColor = Color.Gray;
            }
        }

        private void txtSenha_Enter_1(object sender, EventArgs e)
        {
            if (txtSenha.Text == "Digite sua Senha")
            {
                txtSenha.Text = "";
                txtSenha.ForeColor = Color.Gray;
            }
        }

        private void MostrarSenha_CheckedChanged(object sender, EventArgs e)
        {
            if (chkMostrarSenha.Checked)
            {
                // Mostra o texto
                txtSenha.PasswordChar = false;
            }
            else
            {
                // Oculta o texto
                txtSenha.PasswordChar = true;
            }
        }
    }
}