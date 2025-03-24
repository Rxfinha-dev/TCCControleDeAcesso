using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace TCCControleDeAcesso.Views
{
    public partial class frmVerificacao : Form
    {
        public frmVerificacao()
        {
            InitializeComponent();        
            
        }

        private void frmVerificacao_Load(object sender, EventArgs e)
        {

        }

        private void btnCadastro_Click(object sender, EventArgs e)
        {

        }

        private void btncadastro_MouseEnter(object sender, EventArgs e)
        {
            Button btn = sender as Button;
            btn.FlatStyle = FlatStyle.Flat;
            btn.FlatAppearance.MouseOverBackColor = Color.White;
        }

        private void btnCadastro_MouseLeave(object sender, EventArgs e)
        {
            Button btn = sender as Button;
            btn.FlatStyle = FlatStyle.Flat;
            btn.FlatAppearance.MouseOverBackColor = Color.White;
        }

        private void btnCadastro_MouseHover(object sender, EventArgs e)
        {
            Button btn = sender as Button;
            btn.FlatStyle = FlatStyle.Flat;
            btn.FlatAppearance.MouseOverBackColor = Color.White;
        }
    }
}
