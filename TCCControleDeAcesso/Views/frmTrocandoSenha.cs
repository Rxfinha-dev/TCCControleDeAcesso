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
using ZstdSharp.Unsafe;

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

        NovaSenhaController ns = new NovaSenhaController();

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
                txtNovaSenha.PasswordChar = false;
                txtNovaSenha2.PasswordChar = false;
            }
            else
            {
                txtNovaSenha.PasswordChar = true;
                txtNovaSenha2.PasswordChar = true;
            }
        }
        private void frmTrocandoSenha_Load(object sender, EventArgs e)
        {
            txtNovaSenha.PasswordChar = true;
            txtNovaSenha2.PasswordChar = true;

            btnAlterarSenha.Region = System.Drawing.Region.FromHrgn(CreateRoundRectRgn(0, 0, btnAlterarSenha.Width, btnAlterarSenha.Height, 20, 20));
            btnAlterarSenha.FlatStyle = FlatStyle.Flat;
            btnAlterarSenha.FlatAppearance.BorderSize = 1;  // sem borda
            btnAlterarSenha.BackColor = Color.FromArgb(52, 188, 251); // #34BCFB
            btnAlterarSenha.ForeColor = Color.White; // texto branco

            button1.Cursor = Cursors.Hand;
        }

        private void btnAlterarSenha_Click(object sender, EventArgs e)
        {
            int ContSenha = txtNovaSenha.Texts.Length;

            if (txtNovaSenha.Texts == txtNovaSenha2.Texts && ContSenha > 8 )
            {
                string senha = txtNovaSenha.Texts.Trim();


                //gera hash com salt automático (interno do bcrypt)
                //bcrypt é uma biblioteca importada
                string hash = BCrypt.Net.BCrypt.HashPassword(senha);



                //hash que vai ser armazenado no banco:
                //tenhamos em mente que estamos pegando o valor da hash que foi gerada juntamente com o SaltKey e estamos atribuindo +
                //ela novamente ao campo txtSenha para poder enviarmos ela ao banco de dados sem problemas

                // Para esse bloco de código funcionar primeiro é necessário a refatoração do NovaSenha ficar pronta
                //ns = new Empresa()
                //{
                //    senha = hash,
                //    Email = EmailCadastrado
                //};

                //ns.ChangePasswod();

                MessageBox.Show("Senha alterada com sucesso!");
                this.Close();
                frmLogin loginForm = new frmLogin();
                loginForm.Show();
            }
            else
            {
                MessageBox.Show("As senhas inseridas são diferentes ou a senha não tem a quantidade miníma de 9 caracteres", "ERRO", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            txtNovaSenha.Texts = "";
            txtNovaSenha2.Texts = "";
        }

        private void button1_Click(object sender, EventArgs e)
        {
            this.Close();
            frmLogin frmLogin = new frmLogin();
            frmLogin.ShowDialog();
        }
    }
}
