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

namespace TCCControleDeAcesso.Views
{
    public partial class frmLogin : Form
    {
        Login _login;
        public frmLogin()
        {
            InitializeComponent();
        }

        private void btnEntrar_Click(object sender, EventArgs e)
        {
            _login = new Login()
            {
                nome = txtLogin.Text,
                senha = txtSenha.Text,

            };
            _login.SignIn();

        }

        private void linkLabel2_LinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
        {
            frmCadastroEmpresa check = new frmCadastroEmpresa();
            check.Show();
            Hide();
        }
    }
}
