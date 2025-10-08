using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Data.SqlClient;
using System.Drawing;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Web.UI.WebControls;
using System.Windows.Forms;
using TCCControleDeAcesso.Controllers;
using TCCControleDeAcesso.Models;

namespace TCCControleDeAcesso.Views
{
    public partial class frmTrocandoSenha: Form
    {

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

        String randomCode;
        public static String to;

        NovaSenha ns = new NovaSenha();

       public string EmailCadastrado;
        public frmTrocandoSenha(string email)
        {
            InitializeComponent();
            EmailCadastrado = email;

            
            
        }

        private void chkBoxMostrarSenha_CheckedChanged(object sender, EventArgs e)
        {
            if (chkBoxMostrarSenha.Checked)
            {
                txtNovaSenha.PasswordChar = '\u0000';
                txtNovaSenha2.PasswordChar = '\u0000';
            }
            else
            {
                txtNovaSenha.PasswordChar = '*';
                txtNovaSenha2.PasswordChar = '*';
            }
        }

        private void frmTrocandoSenha_Load(object sender, EventArgs e)
        {
            txtNovaSenha.PasswordChar = '*';
            txtNovaSenha2.PasswordChar = '*';

            btnAlterarSenha.Region = System.Drawing.Region.FromHrgn(CreateRoundRectRgn(0, 0, btnAlterarSenha.Width, btnAlterarSenha.Height, 20, 20));
            btnAlterarSenha.FlatStyle = FlatStyle.Flat;
            btnAlterarSenha.FlatAppearance.BorderSize = 1;  // sem borda
            btnAlterarSenha.BackColor = Color.FromArgb(52, 188, 251); // #34BCFB
            btnAlterarSenha.ForeColor = Color.White; // texto branco

        }

        private void btnAlterarSenha_Click(object sender, EventArgs e)
        {
            //////////////////////////
            ///
            if (txtNovaSenha.Text == txtNovaSenha2.Text)
            {

                ////------------------Vamos tentar implementar A hash (que está com a salt key incluido ja)------------------//



                string senha = txtNovaSenha.Text.Trim();



                //gera hash com salt automático (interno do bcrypt)
                //bcrypt é uma biblioteca importada
                string hash = BCrypt.Net.BCrypt.HashPassword(senha);


                //hash que vai ser armazenado no banco:
                //tenhamos em mente que estamos pegando o valor da hash que foi gerada juntamente com o SaltKey e estamos atribuindo +
                //ela novamente ao campo txtSenha para poder enviarmos ela ao banco de dados sem problemas
                ns = new NovaSenha()
                {
                    senha = hash,
                    email = EmailCadastrado
                };
                ns.ChangePasswod();

                MessageBox.Show("Senha alterada com sucesso!", " ", MessageBoxButtons.OK, MessageBoxIcon.None);
                this.Close();
                frmLogin loginForm = new frmLogin();
                loginForm.Show();

            }
            else
            {

                MessageBox.Show("As senhas inseridas não coincidem!", " ", MessageBoxButtons.OK, MessageBoxIcon.Error);

            }
            txtNovaSenha.Text = "";
            txtNovaSenha2.Text = "";



            ////------------------fim da implementação------------------//
        }





    }
}
