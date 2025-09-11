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

namespace TCCControleDeAcesso.Views
{
    public partial class frmLogin : Form
    {
        Login _login;

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
            //estou a fazer isso aqui 
            //////////////////////////////

            //// --------- login ---------
            ////aqui vamos ter a parte de login com hash e salt key sempre tentando seguir a lógica do bcrypt.net

            //string senhadigitada = Console.ReadLine();

            ////  verifica automaticamente se a senha digitada gera o mesmo hash
            //bool valido = BCrypt.Net.BCrypt.Verify(senhadigitada, hash);


            //if (valido)
            //{
            //    Console.WriteLine("booooooooooaaaaaaaaa mano! tu é parceiro. ");
            //}

            //else
            //{
            //    Console.WriteLine("errou vacilão." +
            //        "míssil lançado.");
            //}

            //////////////////////////////


            //frmMainMenu mainMenu = new frmMainMenu(txtLogin.Text,);
            _login.SignIn();

            CleanAll();

            if (_login.count > 0) {
                Hide();
            }
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

        }

        private void button5_Click(object sender, EventArgs e)
        {
            frmNovaSenha form =  new frmNovaSenha();//IMPORTANTE---------------depois altere isso de volta para o "frmNovaSenha"
            form.Show();
            Hide();

        }

        private void pictureBox1_Click(object sender, EventArgs e)
        {

        }

        private void pictureBox3_Click(object sender, EventArgs e)
        {

        }

        private void txtLogin_TextChanged(object sender, EventArgs e)
        {

        }
        private void txtLogin_Enter(object sender, EventArgs e)
        {

        }

        private void txtLogin_Leave(object sender, EventArgs e)
        {

        }

        private void txtSenha_Enter(object sender, EventArgs e)
        {
        }

        private void txtSenha_Leave(object sender, EventArgs e)
        {
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
    }
}
