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
using TCCControleDeAcesso.Models;
using System.Runtime.InteropServices;

namespace TCCControleDeAcesso.Views
{

    public partial class frmAtivacaoConta : Form
    {
        CadastroEmpresas _cadastroEmpresas;

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


        public frmAtivacaoConta(string text1, string text2, string text3)
        {
            InitializeComponent();
            this.nome = text1;
            this.email = text2;
            this.senha = text3;
        }

        public string propriedade {  get; set; }
        public string senha { get; set; }
        public string email{ get; set; }
        public string nome { get; set; }

            

        private void frmAtivacaoConta_Load(object sender, EventArgs e)
        {


            if (!this.propriedade.Equals(""))
            {

                textBox1.Text = this.propriedade; // trazendo o valor do randonCode para a variavel codigoAtivacao
                string randonCode = textBox1.Text;




            }

            btnAtivacao.Region = System.Drawing.Region.FromHrgn(CreateRoundRectRgn(0, 0, btnAtivacao.Width, btnAtivacao.Height, 20, 20));
            btnEntrar.Region = System.Drawing.Region.FromHrgn(CreateRoundRectRgn(0, 0, btnEntrar.Width, btnEntrar.Height, 20, 20));

            btnEntrar.FlatStyle = FlatStyle.Flat;
            btnEntrar.FlatAppearance.BorderSize = 1;  // sem borda
            btnEntrar.BackColor = Color.FromArgb(52, 188, 251); // #34BCFB
            btnEntrar.ForeColor = Color.White;
            btnEntrar.Font = new Font("Segoe UI", 12F, FontStyle.Bold);

            btnAtivacao.FlatStyle = FlatStyle.Flat;
            btnAtivacao.FlatAppearance.BorderSize = 1;
            btnAtivacao.BackColor = Color.FromArgb(52, 188, 251); // #34BCFB
            btnAtivacao.ForeColor = Color.White;
            btnAtivacao.Font = new Font("Segoe UI", 12F, FontStyle.Bold);


        }

        private void btnAtivacao_Click(object sender, EventArgs e)
        {


            if (txtAtivacao.Text == (textBox1.Text.Trim().ToString()))
            {
                MessageBox.Show("Sua conta foi ativada!", "Ativação da conta", MessageBoxButtons.OK, MessageBoxIcon.Exclamation);

                


                string txtEmail = this.email;
                string txtNome = this.nome;
                string txtSenha = this.senha;

                _cadastroEmpresas = new CadastroEmpresas()
                {

                    Email = txtEmail,
                    Name = txtNome,
                    Senha = txtSenha,

                };
                _cadastroEmpresas.Insert();

                frmLogin rp = new frmLogin();
                rp.Show();
                this.Close();

                this.Hide();

                

            }
            else
            {
                MessageBox.Show("Senha de ativação inválida!", "Tente novamente.", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            

        
        }

        private void btnEntrar_Click(object sender, EventArgs e)
        {
            MessageBox.Show("Lembre-se de verificar a caixa de spam e no lixo! ", "Vamos tentar novamente!", MessageBoxButtons.OK, MessageBoxIcon.Exclamation);
            frmCadastroEmpresa CE = new frmCadastroEmpresa();
            this.Close();
            CE.Show();
        }

        private void lblConfirmacao_Click(object sender, EventArgs e)
        {
            btnAtivacao.Font = new Font("Segoe UI", 12F, FontStyle.Regular);
        }

      
    }
    
}
        
        

