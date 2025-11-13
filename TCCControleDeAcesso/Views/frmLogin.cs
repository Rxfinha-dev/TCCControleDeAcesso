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

        private bool senhaVisivel = false;

        // Timer como campo da classe (System.Windows.Forms.Timer)
        private System.Windows.Forms.Timer flutuarTimer;

        public frmLogin()
        {
            InitializeComponent();

            // Inicializa o timer aqui (ou poderia ser no Load)
            flutuarTimer = new System.Windows.Forms.Timer();
            flutuarTimer.Interval = 18;
            flutuarTimer.Tick += FlutuarTimer_Tick;
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

            try
            {
                _login.PullSenha();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Erro ao consultar senha: " + ex.Message, "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            string senhadigitada = txtSenha.Texts;

            if (_login.count == 1)
            {
                bool valido = false;
                try
                {
                    valido = BCrypt.Net.BCrypt.Verify(senhadigitada, _login.HashBanco);
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Erro ao verificar senha: " + ex.Message, "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                if (valido)
                {
                    _login.LoginPermissions();
                    MessageBox.Show("Login realizado com sucesso!", "Sucesso", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    frmMainMenu check = new frmMainMenu(_login.nome, _login.idEscola);
                    check.Show();
                    this.Hide();
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
            this.Hide();
        }

        private void frmLogin_Load(object sender, EventArgs e)
        {
            Banco.CreateDatabase();

            // Animação do ícone
            baseY = pictureBox3.Top;

            // garante que o timer foi inicializado no construtor (ou inicializa aqui)
            if (flutuarTimer == null)
            {
                flutuarTimer = new System.Windows.Forms.Timer();
                flutuarTimer.Interval = 18;
                flutuarTimer.Tick += FlutuarTimer_Tick;
            }

            flutuarTimer.Start();

            // Configurações iniciais dos campos
            txtSenha    .PasswordChar = true;
            txtLogin.PlaceholderText = "Digite seu Email";
            txtLogin.PlaceholderColor = Color.Gray;
            txtSenha.PlaceholderText = "Digite sua Senha";
            txtSenha.PlaceholderColor = Color.Gray;

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

            // Proteção: só tenta criar a região se o tamanho já estiver definido
            if (button5.Width > 0 && button5.Height > 0)
                button5.Region = Region.FromHrgn(CreateRoundRectRgn(0, 0, button5.Width, button5.Height, 20, 20));

            if (btnEntrar.Width > 0 && btnEntrar.Height > 0)
                btnEntrar.Region = Region.FromHrgn(CreateRoundRectRgn(0, 0, btnEntrar.Width, btnEntrar.Height, 20, 20));
        }

        // Método nomeado para o Tick (mais fácil de controlar / desinscrever)
        private void FlutuarTimer_Tick(object sender, EventArgs e)
        {
            try
            {
                // Se o pictureBox3 foi descartado, não tenta acessar
                if (pictureBox3 == null || pictureBox3.IsDisposed)
                    return;

                // Como usamos System.Windows.Forms.Timer, já estamos na thread de UI,
                // mas por segurança checamos InvokeRequired.
                if (pictureBox3.InvokeRequired)
                {
                    pictureBox3.Invoke(new Action(() =>
                    {
                        angle += speed;
                        pictureBox3.Top = baseY + (int)(Math.Sin(angle) * amplitude);
                    }));
                }
                else
                {
                    angle += speed;
                    pictureBox3.Top = baseY + (int)(Math.Sin(angle) * amplitude);
                }
            }
            catch
            {
                // se algo falhar aqui, apenas interrompe o timer para evitar exceção repetida
                try
                {
                    if (flutuarTimer != null)
                    {
                        flutuarTimer.Stop();
                        flutuarTimer.Tick -= FlutuarTimer_Tick;
                    }
                }
                catch { }
            }
        }

        private void picOlho_Click(object sender, EventArgs e)
        {
            senhaVisivel = !senhaVisivel;
            txtSenha.PasswordChar = !senhaVisivel;
            chkMostrarSenha.Checked = senhaVisivel;
        }

        private void chkMostrarSenha_CheckedChanged(object sender, EventArgs e)
        {
            senhaVisivel = chkMostrarSenha.Checked;
            txtSenha.PasswordChar = !senhaVisivel;
        }

        private void button5_Click(object sender, EventArgs e)
        {
            frmNovaSenha form = new frmNovaSenha();
            form.Show();
            this.Hide();
        }

        private void MostrarSenha_CheckedChanged(object sender, EventArgs e)
        {
            txtSenha.PasswordChar = !chkMostrarSenha.Checked;
        }

        // Ao fechar, pare e descarte o timer para evitar callbacks depois do form descartado
        private void frmLogin_FormClosing(object sender, FormClosingEventArgs e)
        {
            try
            {
                if (flutuarTimer != null)
                {
                    flutuarTimer.Stop();
                    flutuarTimer.Tick -= FlutuarTimer_Tick;
                    flutuarTimer.Dispose();
                    flutuarTimer = null;
                }
            }
            catch { /* ignore */ }
        }

        // Também garantimos liberação final no FormClosed
        private void frmLogin_FormClosed(object sender, FormClosedEventArgs e)
        {
            try
            {
                if (flutuarTimer != null)
                {
                    flutuarTimer.Stop();
                    flutuarTimer.Tick -= FlutuarTimer_Tick;
                    flutuarTimer.Dispose();
                    flutuarTimer = null;
                }
            }
            catch { }
        }
    }
}
