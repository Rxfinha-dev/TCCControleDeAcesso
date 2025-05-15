using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using TCCControleDeAcesso.Controllers;
using TCCControleDeAcesso.Models;

namespace TCCControleDeAcesso.Views
{
    public partial class frmLogin : Form
    {
        Login _login;

       


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
    }
}
