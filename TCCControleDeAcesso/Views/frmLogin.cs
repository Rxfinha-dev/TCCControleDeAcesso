using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Security.Policy;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using TCCControleDeAcesso.Controllers;
using TCCControleDeAcesso.Models;
using ZstdSharp.Unsafe;
using System.Windows.Forms;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.ComponentModel;
using System.Runtime.InteropServices;

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

        public frmLogin()
        {
            InitializeComponent();
        }


        private void CleanAll()
        {
            txtLogin.Clear();
            txtSenha.Clear();
            txtLogin.Focus();
        }
        

        private void btnEntrar_Click(object sender, EventArgs e)
        {
            _login = new Login()
            {
                nome = txtLogin.Text,
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
                MessageBox.Show("usuario inexistente", "Não encontrado");
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
                baseY = pictureBox3.Top; // salva a posição inicial
                Timer flutuarTimer = new Timer();
                flutuarTimer.Interval = 18; // 15 ms para uma animação suave
                flutuarTimer.Tick += (s, ev) =>
                {
                    angle += speed;
                    pictureBox3.Top = baseY + (int)(Math.Sin(angle) * amplitude);
                };
                flutuarTimer.Start();

            txtSenha.PasswordChar = '*';
            txtLogin.Text = "Digite seu Login";
            txtLogin.ForeColor = Color.Gray;
            txtSenha.Text = "Digite sua Senha";
            txtSenha.ForeColor = Color.Gray;

            button5.FlatStyle = FlatStyle.Flat;
            button5.FlatAppearance.BorderSize = 1;  // sem borda
            button5.BackColor = Color.FromArgb(52, 188, 251); // #34BCFB
            button5.ForeColor = Color.White; // texto branco

            btnEntrar.FlatStyle = FlatStyle.Flat;
            btnEntrar.FlatAppearance.BorderSize = 1;  // sem borda
            btnEntrar.BackColor = Color.FromArgb(52, 188, 251); // #34BCFB
            btnEntrar.ForeColor = Color.White; // texto branco

            button5.Region = Region.FromHrgn(CreateRoundRectRgn(0, 0, button5.Width, button5.Height, 20, 20));
            btnEntrar.Region = Region.FromHrgn(CreateRoundRectRgn(0, 0, btnEntrar.Width, btnEntrar.Height, 20, 20));
        }

        private void button5_Click(object sender, EventArgs e)
        {
            frmNovaSenha form =  new frmNovaSenha();//IMPORTANTE---------------depois altere isso de volta para o "frmNovaSenha"
            form.Show();
            Hide();


        }


        private void txtLogin_Leave_1(object sender, EventArgs e)
        {
            if (txtLogin.Text == "")
            {
                txtLogin.Text = "Digite seu Login";
                txtLogin.ForeColor = Color.Gray;

            }
        }

        private void txtLogin_Enter_1(object sender, EventArgs e)
        {
            if (txtLogin.Text == "Digite seu Login")
            {
                txtLogin.Text = "";
                txtLogin.ForeColor = Color.Gray;
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
                txtSenha.PasswordChar = '\u0000';
            }
            else
            {
                txtSenha.PasswordChar = '*';
            }
        }

        private void pictureBox3_Click(object sender, EventArgs e)
        {

        }

        private void pictureBox4_Click(object sender, EventArgs e)
        {

        }

        private void pictureBox3_Click_1(object sender, EventArgs e)
        {

        }
    }
}
