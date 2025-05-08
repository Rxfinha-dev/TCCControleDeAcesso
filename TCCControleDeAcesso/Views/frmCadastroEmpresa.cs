using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Net.Mail;
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
        CadastroEmpresas _cadastroEmpresas;
        public frmCadastroEmpresa()
        {
            InitializeComponent();
        }

        private void btnCadastrar_Click(object sender, EventArgs e)
        {
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
                string.IsNullOrWhiteSpace(txtConfirmarSenha.Text)) //verificando se os campos estão vazios 
            {
                MessageBox.Show("Todos os campos devem ser preenchidos corretamente!", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }



            if (txtSenha.Text == txtConfirmarSenha.Text ) 
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
