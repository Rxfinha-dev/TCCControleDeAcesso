using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using TCCControleDeAcesso.Models;

namespace TCCControleDeAcesso.Views
{
    public partial class frmCadastroEmpresa : Form
    {
        CadastroEmpresas _cadastroEmpresas;
        public frmCadastroEmpresa()
        {
            InitializeComponent();
        }

        private void btnCadastrar_Click(object sender, EventArgs e)
        {

            _cadastroEmpresas = new CadastroEmpresas()
            {
                Name = txtNome.Text,
                Email = txtEmail.Text,
                Senha = txtSenha.Text,
            };
           

            if(txtSenha.Text == txtConfirmarSenha.Text)
            {
                _cadastroEmpresas.Insert();

                frmLogin check = new frmLogin();
                check.Show();
                Hide();
            }
            else
            {
                MessageBox.Show("As Senhas Não Coincidem", "Erro No Login", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
        }
    }
}
