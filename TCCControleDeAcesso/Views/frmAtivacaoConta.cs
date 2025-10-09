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

namespace TCCControleDeAcesso.Views
{

    public partial class frmAtivacaoConta : Form
    {
        CadastroEmpresas _cadastroEmpresas;



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
    }
    
}
        
        

