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

        // VARIÁVEIS DE ANIMAÇÃO
        private Timer animacaoOlho;
        private float escalaOlho = 1f;
        private bool animandoAbertura = false;

        // DECLARAÇÃO ÚNICA DA VARIÁVEL senhaVisivel
        private bool senhaVisivel = false;


        public frmLogin()
        {
            InitializeComponent();
        }


        private void CleanAll()
        {
            txtLogin.Texts = "";
            txtSenha.Texts = "";
            txtLogin.Focus();
        }


        private void btnEntrar_Click(object sender, EventArgs e)
        {
            _login = new Login()
            {
                email = txtLogin.Texts,
                senha = txtSenha.Texts,

            };



            //estou a fazer isso aqui :


            // --------- login ---------
            //aqui vamos ter a parte de login com hash e salt key sempre tentando seguir a lógica do bcrypt.net
            //essa lógica seria gerar uma hash que ja vai estar junto da saltkey e em seguida o próprio Bycript tbm ja faz a leitura e validação,
            //sendo assim, desnecessário realizar o save da salt key de forma separada no banco de dados para validação posterior

            //vamos chamar a função do banco de dados(login.Cs) que vai puxar a senha do banco

            _login.PullSenha();

            //pega a senha digitada e guarda na variável 
            string senhadigitada = txtSenha.Texts;


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

            // Animação do ícone
            baseY = pictureBox3.Top;
            Timer flutuarTimer = new Timer();
            flutuarTimer.Interval = 18;
            flutuarTimer.Tick += (s, ev) =>
            {
                angle += speed;
                pictureBox3.Top = baseY + (int)(Math.Sin(angle) * amplitude);
            };
            flutuarTimer.Start();

            // Configurações iniciais dos campos
            txtSenha.PasswordChar = true;
            txtLogin.Texts = "Digite seu Login";
            txtLogin.ForeColor = Color.Gray;
            txtSenha.Texts = "Digite sua Senha";
            txtSenha.ForeColor = Color.Gray;

            // Botões arredondados
            button5.FlatStyle = FlatStyle.Flat;
            button5.FlatAppearance.BorderSize = 1;
            button5.FlatAppearance.BorderColor = Color.FromArgb(52, 188, 251);
            button5.BackColor = Color.FromArgb(52, 188, 251);
            button5.ForeColor = Color.White;

            btnEntrar.FlatStyle = FlatStyle.Flat;
            btnEntrar.FlatAppearance.BorderSize = 1;
            btnEntrar.BackColor = Color.FromArgb(52, 188, 251);
            btnEntrar.ForeColor = Color.White;

            button5.Region = Region.FromHrgn(CreateRoundRectRgn(0, 0, button5.Width, button5.Height, 20, 20));
            btnEntrar.Region = Region.FromHrgn(CreateRoundRectRgn(0, 0, btnEntrar.Width, btnEntrar.Height, 20, 20));

            // ---------- Ícone do Olho ----------
            picOlho.SizeMode = PictureBoxSizeMode.Zoom;
            picOlho.Image = senha_invisivel;
            picOlho.Cursor = Cursors.Hand;
            picOlho.BackColor = Color.Transparent;

            // Posiciona o olho à direita do campo de senha
            picOlho.Left = txtSenha.Right - 25;
            picOlho.Top = txtSenha.Top + 5;
            picOlho.BringToFront();

            // Sincroniza o estado da checkbox e do ícone
            chkMostrarSenha.Checked = false;
            senhaVisivel = false;

            // ---------- ANIMAÇÃO DO OLHO ----------
            animacaoOlho = new Timer();
            animacaoOlho.Interval = 15; // velocidade da animação
            animacaoOlho.Tick += (s, ev) =>
            {
                if (animandoAbertura)
                {
                    escalaOlho += 0.05f;
                    if (escalaOlho >= 1.1f)
                    {
                        escalaOlho = 1f;
                        animacaoOlho.Stop();
                    }
                }
                else
                {
                    escalaOlho -= 0.05f;
                    if (escalaOlho <= 0.9f)
                    {
                        escalaOlho = 1f;
                        animacaoOlho.Stop();
                    }
                }

                // Redesenha com zoom leve (efeito "piscar")
                picOlho.Width = (int)(24 * escalaOlho);
                picOlho.Height = (int)(24 * escalaOlho);
            };

        }

        private void picOlho_Click(object sender, EventArgs e)
        {
            senhaVisivel = !senhaVisivel;

            txtSenha.PasswordChar = !senhaVisivel;
            picOlho.Image = senhaVisivel ? senha_visivel : senha_invisivel;
            chkMostrarSenha.Checked = senhaVisivel;

            // dispara a animação
            animandoAbertura = senhaVisivel;
            animacaoOlho.Start();
        }


        private void chkMostrarSenha_CheckedChanged(object sender, EventArgs e)
        {
            senhaVisivel = chkMostrarSenha.Checked;

            txtSenha.PasswordChar = !senhaVisivel;
            picOlho.Image = senhaVisivel ? senha_visivel : senha_invisivel;
        }



        private void button5_Click(object sender, EventArgs e)
        {
            frmNovaSenha form = new frmNovaSenha();//IMPORTANTE---------------depois altere isso de volta para o "frmNovaSenha"
            form.Show();
            Hide();
        }


        private void txtLogin_Leave_1(object sender, EventArgs e)
        {
            if (txtLogin.Texts == "")
            {
                txtLogin.Texts = "Digite seu Login";
                txtLogin.ForeColor = Color.Gray;
            }
        }

        private void txtLogin_Enter_1(object sender, EventArgs e)
        {
            if (txtLogin.Texts == "Digite seu Login")
            {
                txtLogin.Texts = "";
                txtLogin.ForeColor = Color.Gray;
            }
        }

        private void txtSenha_Leave_1(object sender, EventArgs e)
        {
            if (txtSenha.Texts == "")
            {
                txtSenha.Texts = "Digite sua Senha";
                txtSenha.ForeColor = Color.Gray;
            }
        }

        private void txtSenha_Enter_1(object sender, EventArgs e)
        {
            if (txtSenha.Texts == "Digite sua Senha")
            {
                txtSenha.Texts = "";
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

        private void txtLoginAntigo_TextChanged(object sender, EventArgs e)
        {

        }

        private void txtSenhaAntigo_TextChanged(object sender, EventArgs e)
        {

        }
    }
}