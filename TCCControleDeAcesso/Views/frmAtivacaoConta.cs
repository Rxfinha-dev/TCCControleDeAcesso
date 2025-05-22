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


        public frmAtivacaoConta()
        {
            InitializeComponent();
        }

        public string propriedade {  get; set; }

        private void btnAtivacao_Click(object sender, EventArgs e)
        { 
            
        }
    }
}
        {
        //    txtAtivacao 
        //    int VarAtivacao = txtAtivacao.Text;
            if(txtAtivacao.Text == (textBox1.Text).ToString())
                {
                MessageBox.Show("Leonidas baitchola", "Verdadeiro", MessageBoxButtons.OK, MessageBoxIcon.Error);
                
            }
            else
            {
                MessageBox.Show("errou vacilão", "jkhdsakjdhsaj    ", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
          /*  frmAtivacaoConra (int randonCode){

            }

            if ()
            {
                _cadastroEmpresas.Insert();
            }
          */
        }

        private void frmAtivacaoConta_Load(object sender, EventArgs e)
        {
            if (!this.propriedade.Equals(""))
            {

                textBox1.Text = this.propriedade; // trazendo o valor do randonCode para a variavel codigoAtivacao
                string randonCode = textBox1.Text;


            }
        }
    }
}
